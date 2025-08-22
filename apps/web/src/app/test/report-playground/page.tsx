'use client';

import { useEffect, useState } from 'react';
import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import type { IReportEditor } from '@/components/ui/report/ReportEditor';
import { AppSplitter } from '@/components/ui/layouts/AppSplitter';
import { useMount } from '@/hooks';

export default function ReportPlayground() {
  // 150 lines of markdown about Red Rising, the sci-fi series by Pierce Brown.
  // This content is used as the initial value for the report editor playground.

  const commonClassName = 'sm:px-[max(64px,calc(50%-350px))]';
  const onChangeContent = (value: string) => {
    console.log(value);
  };
  const readOnly = false;
  const mode = 'default';
  const onReadyProp = (editor: IReportEditor) => {
    console.log(editor);
  };
  const isStreamingMessage = false;

  const [content, setContent] = useState('');

  useMount(() => {
    setTimeout(() => {
      setContent(contentOld);
    }, 1);
  });

  return (
    <div className="h-[700px] overflow-hidden border-2 border-blue-700">
      <DynamicReportEditor
        value={content}
        placeholder="Start typing..."
        // disabled={false}
        className={commonClassName}
        variant="default"
        useFixedToolbarKit={false}
        onValueChange={onChangeContent}
        readOnly={readOnly}
        mode={mode}
        onReady={onReadyProp}
        isStreaming={isStreamingMessage}
      />
    </div>
  );
}

const contentOld = `
# Red Rising: A Deep Dive into Pierce Brown's Dystopian Epic

Red Rising is a science fiction series by Pierce Brown that has captivated readers with its blend of dystopian intrigue, political machinations, and relentless action. Set in a future where society is rigidly divided by color-coded castes, the story follows Darrow, a lowborn Red, as he infiltrates the ruling Golds to spark a revolution.

---

## Table of Contents

1. [Introduction](#introduction)
2. [The World of Red Rising](#the-world-of-red-rising)
3. [The Color Hierarchy](#the-color-hierarchy)
4. [Main Characters](#main-characters)
5. [Plot Overview](#plot-overview)
6. [Themes](#themes)
7. [The Institute](#the-institute)
8. [Political Intrigue](#political-intrigue)
9. [Technology and Society](#technology-and-society)
10. [The Sons of Ares](#the-sons-of-ares)
11. [The Golds](#the-golds)
12. [The Rebellion](#the-rebellion)
13. [Friendship and Betrayal](#friendship-and-betrayal)
14. [The Role of Family](#the-role-of-family)
15. [Violence and Sacrifice](#violence-and-sacrifice)
16. [The Sequel Series](#the-sequel-series)
17. [Critical Reception](#critical-reception)
18. [Adaptations](#adaptations)
19. [Conclusion](#conclusion)

---

## Introduction

Red Rising is more than just a dystopian adventure; it's a meditation on power, identity, and the cost of revolution. Pierce Brown crafts a world that is both familiar and alien, drawing on classical influences and modern anxieties.

---

## The World of Red Rising

The series is set on Mars and other planets, terraformed and colonized by humanity. Society is organized into a strict hierarchy, with each Color assigned specific roles.

---

## The Color Hierarchy

- **Golds**: The ruling elite, genetically engineered for strength and intelligence.
- **Silvers**: Financiers and administrators.
- **Coppers**: Bureaucrats and record-keepers.
- **Blues**: Pilots and navigators.
- **Greens**: Programmers and technical experts.
- **Yellows**: Doctors and scientists.
- **Oranges**: Mechanics and engineers.
- **Violets**: Artists and designers.
- **Obsidians**: Warriors, bred for battle.
- **Grays**: Soldiers and police.
- **Browns**: Servants.
- **Pinks**: Courtesans and companions.
- **Reds**: Miners, the lowest caste, toiling beneath the surface.

---

## Main Characters

- **Darrow of Lykos**: The protagonist, a Red who becomes a Gold.
- **Eo**: Darrow's wife, whose death inspires the rebellion.
- **Sevro au Barca**: Darrow's loyal and unpredictable friend.
- **Mustang (Virginia au Augustus)**: A Gold with a conscience, Darrow's ally and love interest.
- **The Jackal (Adrius au Augustus)**: Mustang's brother, a cunning and ruthless adversary.
- **Cassius au Bellona**: Darrow's friend-turned-rival.

---

## Plot Overview

Darrow, a Helldiver in the Martian mines, discovers that the surface is already habitable and that the Reds have been lied to for generations. After Eo's execution, Darrow is recruited by the Sons of Ares to infiltrate the Golds. He undergoes a painful transformation and enters the Institute, where he must survive brutal trials and political games.

---

## Themes

- **Class Struggle**: The series explores the consequences of rigid social hierarchies.
- **Identity**: Darrow's transformation raises questions about selfhood and authenticity.
- **Revolution**: The cost and necessity of rebellion are central to the narrative.
- **Loyalty and Betrayal**: Friendships are tested in the crucible of war.

---

## The Institute

A brutal training ground for young Golds, the Institute is a microcosm of the larger society. Here, Darrow must lead, fight, and outwit his peers to survive.

---

## Political Intrigue

Red Rising is rife with shifting alliances, betrayals, and power plays. The Golds' society is as cutthroat as any battlefield.

---

## Technology and Society

From gravity manipulation to genetic engineering, technology shapes every aspect of life. Yet, ancient traditions and rituals persist.

---

## The Sons of Ares

A secret organization dedicated to overthrowing the Golds, the Sons of Ares are both idealistic and ruthless.

---

## The Golds

Engineered to be superior, the Golds are both admirable and monstrous. Their society values strength, cunning, and beauty above all.

---

## The Rebellion

Darrow's journey is the spark that ignites a galaxy-wide rebellion, challenging the very foundations of society.

---

## Friendship and Betrayal

Alliances are fragile, and trust is a rare commodity. Darrow's relationships are tested at every turn.

---

## The Role of Family

Family, both biological and chosen, is a recurring motif. Darrow's love for Eo and his loyalty to his friends drive much of the plot.

---

## Violence and Sacrifice

The series does not shy away from the brutality of revolution. Sacrifice is a constant companion.

---

## The Sequel Series

The original trilogy is followed by a new series, expanding the scope and stakes of the story.

---

## Critical Reception

Red Rising has been praised for its world-building, complex characters, and relentless pacing. Critics have compared it to classics like *The Hunger Games* and *Ender's Game*.

---

## Adaptations

Film and television adaptations have been in development, though none have yet reached the screen.

---

## Conclusion

Red Rising is a thrilling, thought-provoking saga that challenges readers to question the world around them. Its blend of action, philosophy, and heart ensures its place among the greats of modern science fiction.

---

*“Break the chains, my love.”*

  `.trim();
