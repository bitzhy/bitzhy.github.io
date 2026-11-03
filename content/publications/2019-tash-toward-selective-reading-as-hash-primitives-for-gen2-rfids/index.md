---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "Tash: Toward selective reading as hash primitives for Gen2 RFIDs"
authors:
  - "Qiongzheng Lin"
  - "Lei Yang"
  - "me"
  - "Zhenlin An"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
date: "2019-04-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "IEEE Transactions on Networking"
  short_name: "IEEE TON"
  volume: "27"
  issue: "2"
  pages: "819-834"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
links:
  - type: pdf
    url: "/papers/2019-tash-toward-selective-reading-as-hash-primitives-for-gen2-rfids.pdf"
hugoblox:
  ids:
    doi: "10.1109/TNET.2019.2896348"
---

## Abstract

Deployment of billions of commercial off-the-shelf (COTS) radio frequency identification (RFID) tags has drawn
much of the attention of the research community because of the performance gaps of current systems. In
particular, hash-enabled protocol (HEP) is one of the most thoroughly studied topics in the past decade. HEPs
are designed for a wide spectrum of notable applications (e.g., missing detection) without need to collect all
tags. HEPs assume that each tag contains a hash function, such that a tag can select a random but predictable
time slot to reply with a one-bit presence signal that shows its existence. However, the hash function has
never been implemented in COTS tags in reality, which makes HEPs a ten-year untouchable mirage. This paper
designs and implements a group of analog on-tag hash primitives (called Tash) for COTS Gen2-compatible RFID
systems, which moves prior HEPs forward from theory to practice. In particular, we design three types of hash
primitives, namely, tash function, tash table function, and tash operator. All of these hash primitives are
implemented through the selective reading, which is a fundamental and mandatory functionality specified in
Gen2 protocol, without any hardware modification and fabrication-a feature allowing zero-cost fast deployment
on billions of Gen2 tags. We further apply our hash primitives in one typical HEP application (i.e., missing
detection) to show the feasibility and effectiveness of Tash. Results from our prototype, which is composed of
one ImpinJ reader and 3000 Alien tags, demonstrate that the new design lowers 70% of the communication
overhead in the air. The tash operator can additionally introduce an overhead drop of 29.7%.

## Citation

Q. Lin, L. Yang, C. Duan, and Z. An, “Tash: Toward Selective Reading as Hash Primitives for Gen2 RFIDs,” IEEE Transactions on Networking (TON), vol. 27, no. 2, pp. 819-834, 2019.

## 中文引用（GB/T 7714）

Lin Q, Yang L, Duan C, et al. Tash: Toward Selective Reading as Hash Primitives for Gen2 RFIDs[J]. IEEE Transactions on Networking (TON), 2019, 27(2): 819-834.
