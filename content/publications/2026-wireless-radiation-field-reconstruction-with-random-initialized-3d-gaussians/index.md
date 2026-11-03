---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "Wireless Radiation Field Reconstruction with Random Initialized 3D Gaussians"
authors:
  - "Zezhou Yao"
  - "me"
  - "Ruoxing Wang"
  - "Fan Li"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
date: "2026-09-30T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies"
  short_name: "ACM IMWUT (UbiComp)"
  volume: "10"
  issue: "3"
  pages: "1-27"
  article_number: "185"
peer_reviewed: true
open_access: true
featured: false
tags:
  - "CCF-A"
links:
  - type: pdf
    url: "/papers/2026-wireless-radiation-field-reconstruction-with-random-initialized-3d-gaussians.pdf"
hugoblox:
  ids:
    doi: "10.1145/3832013"
---

## Abstract

Modern communication systems demand precise wireless channel modeling to underpin the rapid advancement of high-rate, low-latency network technologies. Wireless radiation field reconstruction based on neural networks has recently emerged as a promising research direction, attracting significant attention from the research community due to its potential for accurate scene-aware channel representation. However, existing solutions heavily rely on high-quality point clouds with geometric priors for scene construction. This reliance imposes substantial limitations, primarily stemming from the imperfection of such data and the high costs associated with its acquisition in complex real-world settings. To mitigate this challenge, we propose WRF-RAIN, a generic and effective framework capable of reconstructing robust wireless radiation fields from imperfect, low-quality input data. To this end, WRF-RAIN innovatively introduces a flexible initialization scheme that trains a 3D Gaussian splatting model for wireless channel modeling using only randomly initialized point clouds, which eliminates reliance on prior geometric information and thus fundamentally relaxes the stringent data requirements inherent to prior methods. Furthermore, we develop a progressive low-pass filtering mechanism and an adaptive density control algorithm to adjust point cloud distribution, jointly guiding optimization from coarse to fine. These designs effectively compensate for the absence of geometric priors caused by random initialization and balance global scene coherence with local detail preservation. Extensive evaluations demonstrate that our framework outperforms state-of-the-art methods under sparse or noisy data conditions, offering a scalable, real-time solution for next-generation networks and various applications.

Abstract from the [ACM publication](https://dl.acm.org/doi/10.1145/3832013), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Citation

Z. Yao, C. Duan, R. Wang, and F. Li, “Wireless Radiation Field Reconstruction with Random Initialized 3D Gaussians,” Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies (IMWUT), vol. 10, no. 3, Art. no. 185, pp. 1-27, Sep. 2026, doi: 10.1145/3832013.

## 中文引用（GB/T 7714）

Yao Z, Duan C, Wang R, et al. Wireless Radiation Field Reconstruction with Random Initialized 3D Gaussians[J]. Proceedings of the ACM on Interactive, Mobile, Wearable and Ubiquitous Technologies, 2026, 10(3): 185:1-185:27. DOI: 10.1145/3832013.
