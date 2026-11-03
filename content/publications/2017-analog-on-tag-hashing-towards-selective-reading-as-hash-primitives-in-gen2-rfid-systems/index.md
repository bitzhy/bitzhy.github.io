---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "Analog On-Tag Hashing: Towards Selective Reading as Hash Primitives in Gen2 RFID Systems"
authors:
  - "Lei Yang"
  - "Qiongzheng Lin"
  - "me"
  - "Zhenlin An"
author_notes:
  - "Corresponding author"
  - ""
  - ""
  - ""
date: "2017-10-16T00:00:00Z"
publication_types: ["paper-conference"]
publication:
  name: "ACM International Conference on Mobile Computing and Networking"
  short_name: "ACM MobiCom"
  pages: "301-314"
  location: "Snowbird, UT"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
links:
  - type: pdf
    url: "/papers/2017-analog-on-tag-hashing-towards-selective-reading-as-hash-primitives-in-gen2-rfid-systems.pdf"
hugoblox:
  ids:
    doi: "10.1145/3117811.3117835"
---

## Abstract

Deployment of billions of Commercial Off-The-Shelf (COTS) RFID tags has drawn much of the attention of the
research community because of the performance gaps of current systems. In particular, hash-enabled protocol
(HEP) is one of the most thoroughly studied topics in the past decade. HEPs are designed for a wide spectrum
of notable applications (e.g., missing detection) without need to collect all tags. HEPs assume that each tag
contains a hash function, such that a tag can select a random but predicable time slot to reply with a one-bit
presence signal that shows its existence. However, the hash function has never been implemented in COTS tags
in reality, which makes HEPs a 10-year untouchable mirage. This work designs and implements a group of analog
on-tag hash primitives (called Tash) for COTS Gen2-compatible RFID systems, which moves prior HEPs forward
from theory to practice. In particular, we design three types of hash primitives, namely, tash function, tash
table function and tash operator. All of these hash primitives are implemented through selective reading,
which is a fundamental and mandatory functionality specified in Gen2 protocol, without any hardware
modification and fabrication. We further apply our hash primitives in two typical HEP applications (i.e.,
cardinality estimation and missing detection) to show the feasibility and effectiveness of Tash. Results from
our prototype, which is composed of one ImpinJ reader and 3,000 Alien tags, demonstrate that the new design
lowers 60% of the communication overhead in the air. The tash operator can additionally introduce an overhead
drop of 29.7%.

## Citation

L.Yang, Q. Lin, C. Duan, and Z. An, “Analog On-Tag Hashing: Towards Selective Reading as Hash Primitives in Gen2 RFID Systems,” in Proceedings of the ACM International Conference on Mobile Computing and Networking (MobiCom), 2017, pp. 301-314.

## 中文引用（GB/T 7714）

Yang L, Lin Q, Duan C, et al. Analog On-Tag Hashing: Towards Selective Reading as Hash Primitives in Gen2 RFID Systems[C]//Proceedings of the ACM International Conference on Mobile Computing and Networking (MobiCom). 2017: 301-314.
