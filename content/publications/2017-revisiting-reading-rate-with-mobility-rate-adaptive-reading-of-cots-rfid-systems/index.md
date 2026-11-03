---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "Revisiting Reading Rate with Mobility: Rate-Adaptive Reading of COTS RFID Systems"
authors:
  - "Qiongzheng Lin"
  - "Lei Yang"
  - "me"
  - "Yunhao Liu"
author_notes:
  - "Corresponding author"
  - "Corresponding author"
  - ""
  - ""
date: "2017-12-12T00:00:00Z"
publication_types: ["paper-conference"]
publication:
  name: "ACM International Conference on emerging Networking EXperiments and Technologies"
  short_name: "ACM CoNEXT"
  pages: "199-211"
  location: "Seoul/Incheon, South Korea"
peer_reviewed: true
featured: false
tags:
  - "CCF-B"
links:
  - type: pdf
    url: "/papers/2017-revisiting-reading-rate-with-mobility-rate-adaptive-reading-of-cots-rfid-systems.pdf"
hugoblox:
  ids:
    doi: "10.1145/3143361.3143387"
---

## Abstract

Radio-frequency identification (RFID) systems, as major enablers of automatic identification, are currently
supplemented with various interesting sensing functions, e.g., motion tracking. All these sensing applications
forcedly require much higher reading rate (i.e., sampling rate) such that any fast movement of tagged objects
can be accurately captured in a timely manner through tag readings. However, COTS RFID systems suffer from an
extremely low individual reading rate when multiple tags are present, due to their intense channel contention
in the link layer. In this work, we present a holistic system, called Tagwatch, a rate-adaptive reading system
for COTS RFID devices. This work revisits the reading rate from a distinctive perspective: mobility. We
observe that the reading demands of mobile tags are considerably more urgent than those of stationary tags
because the states of the latter nearly remain unchanged; meanwhile, only a few tags (e.g., < 20%) are
actually in motion despite the existence of a massive amount of tags in practice. Thus, Tagwatch adaptively
improves the reading rates for mobile tags by cutting down the readings of stationary tags. Our main
contribution is a two-phase reading design, wherein the mobile tags are discriminated in the Phase I and
exclusively read in the Phase II. We built a prototype of Tagwatch with COTS RFID readers and tags. Results
from our microbenchmark analysis demonstrate that the new design outperforms the reading rate by 3.2x when 5%
of tags are moving.

## Citation

Q. Lin, L. Yang, H. Jia, C. Duan, and Y. Liu, “Revisiting Reading Rate with Mobility: Rate-Adaptive Reading in COTS RFID Systems,” in Proceedings of the ACM International Conference on emerging Networking EXperiments and Technologies (CoNEXT), 2017, pp. 199-211.

## 中文引用（GB/T 7714）

Lin Q, Yang L, Jia H, et al. Revisiting Reading Rate with Mobility: Rate-Adaptive Reading in COTS RFID Systems[C]//Proceedings of the ACM International Conference on emerging Networking EXperiments and Technologies (CoNEXT). 2017: 199-211.
