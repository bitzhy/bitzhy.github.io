---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "mmWave Radar-Based Unsupervised Person ReID via Multi-Level Mutual Signal Contrastive Learning"
authors:
  - "Qihua Feng"
  - "me"
  - "Litian Zhang"
  - "Zhiquan Liu"
  - "Feiran Huang"
  - "Jian Weng"
  - "Philip S. Yu"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
  - ""
  - ""
  - ""
date: "2026-07-13T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "IEEE Transactions on Mobile Computing"
  short_name: "IEEE TMC"
  volume: "0"
  issue: "0"
  pages: "1-18"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
  - "中科院一区"
links:
  - type: pdf
    url: "/papers/2026-mmwave-radar-based-unsupervised-person-reid-via-multi-level-mutual-signal-contrastive-learning.pdf"
hugoblox:
  ids:
    doi: "10.1109/TMC.2026.3713047"
---

## Abstract

Person Re-IDentification (ReID) is vital for public-safety applications, yet camera-based ReID suffers in low-light environments and poses serious visual privacy risks. In contrast, millimeter-wave (mmWave) radar sensing has gained significant attention in ReID due to its ability to perceive human movement patterns by emitting electromagnetic waves, making ReID unaffected by lighting conditions and capable of privacy preserving. However, current radar-based ReID methods are primarily supervised, and radar data is challenging for human eyes to interpret, making annotation extremely difficult and costly. To this end, we propose an unsupervised radar ReID method based on multi-level cross-view mutual signal contrastive learning. Firstly, to drive unsupervised contrastive learning that depends on data augmentations, we utilize signal processing techniques to transform raw radar signals into frequency spectrum and point clouds, and these forms constitute different and complementary augmented versions of the same sample. Secondly, we construct a multi-level contrastive model between frequency spectrum signals and point clouds through global contrast, cross-view prediction contrast, clustering contrast, and cross-view cluster center contrast, effectively aligning different views and enhancing unsupervised robustness. Additionally, we employ a well-designed local and global graph attention network to learn more discriminative radar point cloud features. Extensive experimental results illustrate that our approach significantly outperforms existing radar-based unsupervised methods. Our code is available at https://github.com/onlinehuazai/mmReID.

## Citation

Q. Feng, C. Duan, L. Zhang, Z. Liu, F. Huang, J. Weng, and P. S. Yu, “mmWave Radar-Based Unsupervised Person ReID via Multi-Level Mutual Signal Contrastive Learning,” IEEE Transactions on Mobile Computing (TMC), vol. 0, no. 0, pp. 1-18, 2026.

## 中文引用（GB/T 7714）

Feng Q, Duan C, Zhang L, et al. mmWave Radar-Based Unsupervised Person ReID via Multi-Level Mutual Signal Contrastive Learning[J]. IEEE Transactions on Mobile Computing (TMC), 2026, 0(0): 1-18.
