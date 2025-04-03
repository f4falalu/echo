use std::sync::Arc;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use middleware::AuthenticatedUser;

use super::{
    collections::collections_router::{collections_router, CollectionRoute},
    metrics::{metrics_router, MetricRoute},
    organizations::organization_router::{organizations_router, OrganizationRoute},
    permissions::permissions_router::{permissions_router, PermissionRoute},
    search::search_router::{search_router, SearchRoute},
    teams::teams_routes::{teams_router, TeamRoute},
    terms::terms_router::{terms_router, TermRoute},
    users::users_router::{users_router, UserRoute},
    threads_and_messages::threads_router::{threads_router, ThreadRoute},
    ws::SubscriptionRwLock,
};

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(untagged)]
pub enum WsRoutes {
    Users(UserRoute),
    Collections(CollectionRoute),
    Teams(TeamRoute),
    Permissions(PermissionRoute),
    Terms(TermRoute),
    Search(SearchRoute),
    Organizations(OrganizationRoute),
    Metrics(MetricRoute),
    Threads(ThreadRoute),
}

impl WsRoutes {
    pub fn from_str(path: &str) -> Result<Self> {
        let first_segment = path
            .split('/')
            .nth(1)
            .ok_or_else(|| anyhow!("Invalid path"))?;

        match first_segment {
            "users" => Ok(Self::Users(UserRoute::from_str(path)?)),
            "collections" => Ok(Self::Collections(CollectionRoute::from_str(path)?)),
            "teams" => Ok(Self::Teams(TeamRoute::from_str(path)?)),
            "permissions" => Ok(Self::Permissions(PermissionRoute::from_str(path)?)),
            "terms" => Ok(Self::Terms(TermRoute::from_str(path)?)),
            "search" => Ok(Self::Search(SearchRoute::from_str(path)?)),
            "organizations" => Ok(Self::Organizations(OrganizationRoute::from_str(path)?)),
            "metrics" => Ok(Self::Metrics(MetricRoute::from_str(path)?)),
            "chats" => Ok(Self::Threads(ThreadRoute::from_str(path)?)),
            _ => Err(anyhow!("Invalid path")),
        }
    }
}

pub async fn ws_router(
    route: String,
    payload: Value,
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &AuthenticatedUser,
) -> Result<()> {
    let parsed_route: WsRoutes = match WsRoutes::from_str(&route) {
        Ok(parsed_route) => parsed_route,
        Err(e) => {
            return Err(anyhow!("Error parsing route: {:?}", e));
        }
    };

    let result = match parsed_route {
        WsRoutes::Threads(threads_route) => threads_router(threads_route, payload, subscriptions, user_group, user).await,
        WsRoutes::Permissions(permissions_route) => {
            permissions_router(permissions_route, payload, user).await
        }
        WsRoutes::Users(users_route) => users_router(users_route, payload, user).await,
        WsRoutes::Collections(collections_route) => {
            collections_router(collections_route, payload, subscriptions, user_group, user).await
        }
        WsRoutes::Teams(teams_route) => teams_router(teams_route, payload, user).await,
        WsRoutes::Terms(terms_route) => terms_router(terms_route, payload, user).await,
        WsRoutes::Search(search_route) => search_router(search_route, payload, user).await,
        WsRoutes::Organizations(organizations_route) => {
            organizations_router(organizations_route, payload, user).await
        }
        WsRoutes::Metrics(metrics_route) => metrics_router(metrics_route, payload, user).await,
    };

    if let Err(e) = result {
        tracing::error!("Error: {}", e);
    }

    Ok(())
}
