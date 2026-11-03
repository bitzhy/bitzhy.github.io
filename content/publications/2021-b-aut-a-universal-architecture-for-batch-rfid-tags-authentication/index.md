---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "B-AUT: A Universal Architecture for Batch RFID Tags Authentication"
authors:
  - "Yinan Zhu"
  - "me"
  - "Xuan Ding"
  - "Zheng Yang"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
date: "2021-12-14T00:00:00Z"
publication_types: ["paper-conference"]
publication:
  name: "IEEE International Conference on Parallel and Distributed Systems"
  short_name: "IEEE ICPADS"
  pages: "755-762"
  location: "Beijing, China"
peer_reviewed: true
featured: false
tags:
  - "CCF-C"
links:
  - type: pdf
    url: "/papers/2021-b-aut-a-universal-architecture-for-batch-rfid-tags-authentication.pdf"
hugoblox:
  ids:
    doi: "10.1109/ICPADS53394.2021.00100"
---

## Abstract

RFID tags authentication is always a critical but challenging problem because only checking the EPC is
vulnerable to counterfeiting attacks. Past works explore the unique backscat-ter signal features induced by
tags' manufacturing imperfection as fingerprints, but fail to support simultaneous authentication for a batch
of tags in practice, which is vital for large-scale RFID applications (e.g., warehouse inventory). In this
paper, we present a universal architecture, namely B-AUT, to simultaneously authenticate multiple tags even
with the same EPC and pinpoint them, which is fully compatible with Gen2 standard and applicable to almost all
tags' hardware fingerprints proposed in existing works. The workflow of B-AUT is threefold based on our novel
algorithms. First, the extracted fuzzy fingerprint and EPC are jointly exploited to cluster raw data. Second,
we extract the tags' fine-grained fingerprints for genuineness validation and obtain the invalid clusters.
Third, we harness localization methods to match the invalid cluster to dubious tags and further conduct
small-scale re-validation to pinpoint the counterfeit tags. We have implemented a prototype of B-AUT and
evaluated it in extreme cases. Experiment results demonstrate that B-AUT can maintain nearly the same
authentication accuracy as that of separate authentication and reduce the time overhead by 43.3%. Moreover,
the pinpointing accuracy can reach as high as 92.8%, regardless of tags' total quantities or tag models.

## Citation

Y. Zhu, C. Duan, X. Ding, and Z. Yang, “B-AUT: A Universal Architecture for Batch RFID Tags Authentication,” in Proceedings of the IEEE International Conference on Parallel and Distributed Systems (ICPADS), 2021, pp. 755-762.

## 中文引用（GB/T 7714）

Zhu Y, Duan C, Ding X, et al. B-AUT: A Universal Architecture for Batch RFID Tags Authentication[C]//Proceedings of the IEEE International Conference on Parallel and Distributed Systems (ICPADS). 2021:755-762.
