import { relations } from 'drizzle-orm/relations';
import {
  apiKeys,
  assetPermissions,
  chats,
  collections,
  collectionsToAssets,
  dashboardFiles,
  dataSources,
  datasetGroups,
  datasetGroupsPermissions,
  datasetPermissions,
  datasets,
  datasetsToDatasetGroups,
  datasetsToPermissionGroups,
  messages,
  messagesToFiles,
  metricFiles,
  metricFilesToDashboardFiles,
  metricFilesToDatasets,
  metricFilesToReportFiles,
  organizations,
  permissionGroups,
  permissionGroupsToIdentities,
  permissionGroupsToUsers,
  reportFiles,
  s3Integrations,
  teams,
  teamsToUsers,
  userFavorites,
  users,
  usersToOrganizations,
} from './schema';

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiKeys.ownerId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  apiKeys: many(apiKeys),
  teams: many(teams),
  permissionGroups: many(permissionGroups),
  collections: many(collections),
  dataSources: many(dataSources),
  datasetGroups: many(datasetGroups),
  datasetPermissions: many(datasetPermissions),
  datasetGroupsPermissions: many(datasetGroupsPermissions),
  datasets: many(datasets),
  chats: many(chats),
  usersToOrganizations: many(usersToOrganizations),
  s3Integrations: many(s3Integrations),
}));

export const s3IntegrationsRelations = relations(s3Integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [s3Integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  teams: many(teams),
  permissionGroups_createdBy: many(permissionGroups, {
    relationName: 'permissionGroups_createdBy_users_id',
  }),
  permissionGroups_updatedBy: many(permissionGroups, {
    relationName: 'permissionGroups_updatedBy_users_id',
  }),
  collections_createdBy: many(collections, {
    relationName: 'collections_createdBy_users_id',
  }),
  collections_updatedBy: many(collections, {
    relationName: 'collections_updatedBy_users_id',
  }),
  dataSources_createdBy: many(dataSources, {
    relationName: 'dataSources_createdBy_users_id',
  }),
  dataSources_updatedBy: many(dataSources, {
    relationName: 'dataSources_updatedBy_users_id',
  }),
  datasets_createdBy: many(datasets, {
    relationName: 'datasets_createdBy_users_id',
  }),
  datasets_updatedBy: many(datasets, {
    relationName: 'datasets_updatedBy_users_id',
  }),
  messages: many(messages),
  dashboardFiles_createdBy: many(dashboardFiles, {
    relationName: 'dashboardFiles_createdBy_users_id',
  }),
  dashboardFiles_publiclyEnabledBy: many(dashboardFiles, {
    relationName: 'dashboardFiles_publiclyEnabledBy_users_id',
  }),
  chats_createdBy: many(chats, {
    relationName: 'chats_createdBy_users_id',
  }),
  chats_updatedBy: many(chats, {
    relationName: 'chats_updatedBy_users_id',
  }),
  chats_publiclyEnabledBy: many(chats, {
    relationName: 'chats_publiclyEnabledBy_users_id',
  }),
  metricFiles_createdBy: many(metricFiles, {
    relationName: 'metricFiles_createdBy_users_id',
  }),
  metricFiles_publiclyEnabledBy: many(metricFiles, {
    relationName: 'metricFiles_publiclyEnabledBy_users_id',
  }),
  permissionGroupsToUsers: many(permissionGroupsToUsers),
  userFavorites: many(userFavorites),
  teamsToUsers: many(teamsToUsers),
  metricFilesToDashboardFiles: many(metricFilesToDashboardFiles),
  metricFilesToReportFiles: many(metricFilesToReportFiles),
  collectionsToAssets_createdBy: many(collectionsToAssets, {
    relationName: 'collectionsToAssets_createdBy_users_id',
  }),
  collectionsToAssets_updatedBy: many(collectionsToAssets, {
    relationName: 'collectionsToAssets_updatedBy_users_id',
  }),
  permissionGroupsToIdentities_createdBy: many(permissionGroupsToIdentities, {
    relationName: 'permissionGroupsToIdentities_createdBy_users_id',
  }),
  permissionGroupsToIdentities_updatedBy: many(permissionGroupsToIdentities, {
    relationName: 'permissionGroupsToIdentities_updatedBy_users_id',
  }),
  assetPermissions_createdBy: many(assetPermissions, {
    relationName: 'assetPermissions_createdBy_users_id',
  }),
  assetPermissions_updatedBy: many(assetPermissions, {
    relationName: 'assetPermissions_updatedBy_users_id',
  }),
  usersToOrganizations_userId: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_userId_users_id',
  }),
  usersToOrganizations_createdBy: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_createdBy_users_id',
  }),
  usersToOrganizations_updatedBy: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_updatedBy_users_id',
  }),
  usersToOrganizations_deletedBy: many(usersToOrganizations, {
    relationName: 'usersToOrganizations_deletedBy_users_id',
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  teamsToUsers: many(teamsToUsers),
}));

export const permissionGroupsRelations = relations(permissionGroups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [permissionGroups.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [permissionGroups.createdBy],
    references: [users.id],
    relationName: 'permissionGroups_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [permissionGroups.updatedBy],
    references: [users.id],
    relationName: 'permissionGroups_updatedBy_users_id',
  }),
  permissionGroupsToUsers: many(permissionGroupsToUsers),
  datasetsToPermissionGroups: many(datasetsToPermissionGroups),
}));

export const collectionsRelations = relations(collections, ({ one }) => ({
  organization: one(organizations, {
    fields: [collections.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [collections.createdBy],
    references: [users.id],
    relationName: 'collections_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [collections.updatedBy],
    references: [users.id],
    relationName: 'collections_updatedBy_users_id',
  }),
}));

export const dataSourcesRelations = relations(dataSources, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [dataSources.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [dataSources.createdBy],
    references: [users.id],
    relationName: 'dataSources_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [dataSources.updatedBy],
    references: [users.id],
    relationName: 'dataSources_updatedBy_users_id',
  }),
  datasets: many(datasets),
  metricFiles: many(metricFiles),
}));

export const datasetGroupsRelations = relations(datasetGroups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [datasetGroups.organizationId],
    references: [organizations.id],
  }),
  datasetGroupsPermissions: many(datasetGroupsPermissions),
  datasetsToDatasetGroups: many(datasetsToDatasetGroups),
}));

export const datasetPermissionsRelations = relations(datasetPermissions, ({ one }) => ({
  organization: one(organizations, {
    fields: [datasetPermissions.organizationId],
    references: [organizations.id],
  }),
  dataset: one(datasets, {
    fields: [datasetPermissions.datasetId],
    references: [datasets.id],
  }),
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  datasetPermissions: many(datasetPermissions),
  dataSource: one(dataSources, {
    fields: [datasets.dataSourceId],
    references: [dataSources.id],
  }),
  organization: one(organizations, {
    fields: [datasets.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [datasets.createdBy],
    references: [users.id],
    relationName: 'datasets_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [datasets.updatedBy],
    references: [users.id],
    relationName: 'datasets_updatedBy_users_id',
  }),
  metricFilesToDatasets: many(metricFilesToDatasets),
  datasetsToPermissionGroups: many(datasetsToPermissionGroups),
  datasetsToDatasetGroups: many(datasetsToDatasetGroups),
}));

export const datasetGroupsPermissionsRelations = relations(datasetGroupsPermissions, ({ one }) => ({
  datasetGroup: one(datasetGroups, {
    fields: [datasetGroupsPermissions.datasetGroupId],
    references: [datasetGroups.id],
  }),
  organization: one(organizations, {
    fields: [datasetGroupsPermissions.organizationId],
    references: [organizations.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [messages.createdBy],
    references: [users.id],
  }),
  messagesToFiles: many(messagesToFiles),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  messages: many(messages),
  organization: one(organizations, {
    fields: [chats.organizationId],
    references: [organizations.id],
  }),
  user_createdBy: one(users, {
    fields: [chats.createdBy],
    references: [users.id],
    relationName: 'chats_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [chats.updatedBy],
    references: [users.id],
    relationName: 'chats_updatedBy_users_id',
  }),
  user_publiclyEnabledBy: one(users, {
    fields: [chats.publiclyEnabledBy],
    references: [users.id],
    relationName: 'chats_publiclyEnabledBy_users_id',
  }),
}));

export const messagesToFilesRelations = relations(messagesToFiles, ({ one }) => ({
  message: one(messages, {
    fields: [messagesToFiles.messageId],
    references: [messages.id],
  }),
}));

export const dashboardFilesRelations = relations(dashboardFiles, ({ one, many }) => ({
  user_createdBy: one(users, {
    fields: [dashboardFiles.createdBy],
    references: [users.id],
    relationName: 'dashboardFiles_createdBy_users_id',
  }),
  user_publiclyEnabledBy: one(users, {
    fields: [dashboardFiles.publiclyEnabledBy],
    references: [users.id],
    relationName: 'dashboardFiles_publiclyEnabledBy_users_id',
  }),
  metricFilesToDashboardFiles: many(metricFilesToDashboardFiles),
}));

export const metricFilesRelations = relations(metricFiles, ({ one, many }) => ({
  user_createdBy: one(users, {
    fields: [metricFiles.createdBy],
    references: [users.id],
    relationName: 'metricFiles_createdBy_users_id',
  }),
  user_publiclyEnabledBy: one(users, {
    fields: [metricFiles.publiclyEnabledBy],
    references: [users.id],
    relationName: 'metricFiles_publiclyEnabledBy_users_id',
  }),
  dataSource: one(dataSources, {
    fields: [metricFiles.dataSourceId],
    references: [dataSources.id],
  }),
  metricFilesToDatasets: many(metricFilesToDatasets),
  metricFilesToDashboardFiles: many(metricFilesToDashboardFiles),
  metricFilesToReportFiles: many(metricFilesToReportFiles),
}));

export const permissionGroupsToUsersRelations = relations(permissionGroupsToUsers, ({ one }) => ({
  permissionGroup: one(permissionGroups, {
    fields: [permissionGroupsToUsers.permissionGroupId],
    references: [permissionGroups.id],
  }),
  user: one(users, {
    fields: [permissionGroupsToUsers.userId],
    references: [users.id],
  }),
}));

export const metricFilesToDatasetsRelations = relations(metricFilesToDatasets, ({ one }) => ({
  metricFile: one(metricFiles, {
    fields: [metricFilesToDatasets.metricFileId],
    references: [metricFiles.id],
  }),
  dataset: one(datasets, {
    fields: [metricFilesToDatasets.datasetId],
    references: [datasets.id],
  }),
}));

export const datasetsToPermissionGroupsRelations = relations(
  datasetsToPermissionGroups,
  ({ one }) => ({
    dataset: one(datasets, {
      fields: [datasetsToPermissionGroups.datasetId],
      references: [datasets.id],
    }),
    permissionGroup: one(permissionGroups, {
      fields: [datasetsToPermissionGroups.permissionGroupId],
      references: [permissionGroups.id],
    }),
  })
);

export const datasetsToDatasetGroupsRelations = relations(datasetsToDatasetGroups, ({ one }) => ({
  dataset: one(datasets, {
    fields: [datasetsToDatasetGroups.datasetId],
    references: [datasets.id],
  }),
  datasetGroup: one(datasetGroups, {
    fields: [datasetsToDatasetGroups.datasetGroupId],
    references: [datasetGroups.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
}));

export const teamsToUsersRelations = relations(teamsToUsers, ({ one }) => ({
  team: one(teams, {
    fields: [teamsToUsers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamsToUsers.userId],
    references: [users.id],
  }),
}));

export const metricFilesToDashboardFilesRelations = relations(
  metricFilesToDashboardFiles,
  ({ one }) => ({
    metricFile: one(metricFiles, {
      fields: [metricFilesToDashboardFiles.metricFileId],
      references: [metricFiles.id],
    }),
    dashboardFile: one(dashboardFiles, {
      fields: [metricFilesToDashboardFiles.dashboardFileId],
      references: [dashboardFiles.id],
    }),
    user: one(users, {
      fields: [metricFilesToDashboardFiles.createdBy],
      references: [users.id],
    }),
  })
);

export const metricFilesToReportFilesRelations = relations(metricFilesToReportFiles, ({ one }) => ({
  metricFile: one(metricFiles, {
    fields: [metricFilesToReportFiles.metricFileId],
    references: [metricFiles.id],
  }),
  reportFile: one(reportFiles, {
    fields: [metricFilesToReportFiles.reportFileId],
    references: [reportFiles.id],
  }),
  user: one(users, {
    fields: [metricFilesToReportFiles.createdBy],
    references: [users.id],
  }),
}));

export const collectionsToAssetsRelations = relations(collectionsToAssets, ({ one }) => ({
  user_createdBy: one(users, {
    fields: [collectionsToAssets.createdBy],
    references: [users.id],
    relationName: 'collectionsToAssets_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [collectionsToAssets.updatedBy],
    references: [users.id],
    relationName: 'collectionsToAssets_updatedBy_users_id',
  }),
}));

export const permissionGroupsToIdentitiesRelations = relations(
  permissionGroupsToIdentities,
  ({ one }) => ({
    user_createdBy: one(users, {
      fields: [permissionGroupsToIdentities.createdBy],
      references: [users.id],
      relationName: 'permissionGroupsToIdentities_createdBy_users_id',
    }),
    user_updatedBy: one(users, {
      fields: [permissionGroupsToIdentities.updatedBy],
      references: [users.id],
      relationName: 'permissionGroupsToIdentities_updatedBy_users_id',
    }),
  })
);

export const assetPermissionsRelations = relations(assetPermissions, ({ one }) => ({
  user_createdBy: one(users, {
    fields: [assetPermissions.createdBy],
    references: [users.id],
    relationName: 'assetPermissions_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [assetPermissions.updatedBy],
    references: [users.id],
    relationName: 'assetPermissions_updatedBy_users_id',
  }),
}));

export const usersToOrganizationsRelations = relations(usersToOrganizations, ({ one }) => ({
  organization: one(organizations, {
    fields: [usersToOrganizations.organizationId],
    references: [organizations.id],
  }),
  user_userId: one(users, {
    fields: [usersToOrganizations.userId],
    references: [users.id],
    relationName: 'usersToOrganizations_userId_users_id',
  }),
  user_createdBy: one(users, {
    fields: [usersToOrganizations.createdBy],
    references: [users.id],
    relationName: 'usersToOrganizations_createdBy_users_id',
  }),
  user_updatedBy: one(users, {
    fields: [usersToOrganizations.updatedBy],
    references: [users.id],
    relationName: 'usersToOrganizations_updatedBy_users_id',
  }),
  user_deletedBy: one(users, {
    fields: [usersToOrganizations.deletedBy],
    references: [users.id],
    relationName: 'usersToOrganizations_deletedBy_users_id',
  }),
}));

// Metadata tables have been deprecated and moved to deprecated schema
