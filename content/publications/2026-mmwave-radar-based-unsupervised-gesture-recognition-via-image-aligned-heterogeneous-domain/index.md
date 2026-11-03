---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "mmWave Radar-Based Unsupervised Gesture Recognition via Image-Aligned Heterogeneous Domain Transfer"
authors:
  - "Qihua Feng"
  - "Kunpeng Cheng"
  - "me"
author_notes:
  - ""
  - ""
  - "Corresponding author"
date: "2026-03-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "IEEE Transactions on Mobile Computing"
  short_name: "IEEE TMC"
  volume: "25"
  issue: "3"
  pages: "3279-3296"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
  - "中科院一区"
links:
  - type: pdf
    url: "/papers/2026-mmwave-radar-based-unsupervised-gesture-recognition-via-image-aligned-heterogeneous-domain.pdf"
hugoblox:
  ids:
    doi: "10.1109/TMC.2025.3614353"
---

## Abstract

Human Gesture Recognition (HGR) using mmWave radar has become increasingly promising due to its exceptional
contactless perception sensitivity. Conventional approaches predominantly rely on supervised models to learn
radar signals, thus incurring substantial costs associated with annotation. To address this limitation,
certain works embrace transfer learning to effectively transfer knowledge from labeled source domain to
unlabeled target domain, achieving unsupervised recognition in the target domain. However, existing
transfer-based methods still necessitate large-scale labeled source domain radar data, thereby constraining
their practical applicability. To this end, we propose a novel unsupervised solution for mmWave-based HGR by
transferring public image gestures to radar data, eliminating the need for acquiring labeled radar data in
source domain. We aim to establish heterogeneous alignment between images and radar signals, facilitating
cross-domain transfer. Initially, we mitigate the negative impact of data heterogeneity by employing
sophisticated signal processing techniques to convert raw radar signals into gesture trajectories.
Subsequently, we introduce an Adversarial-Contrastive Domain Transfer Model (ACDTM) to achieve fine-grained
alignment. ACDTM not only confuses the source and target domains by adversarial learning, enabling the
acquisition of domain-invariant features, but also designs a robust similarity matrix to facilitate
intra-class alignment through contrastive learning. Additionally, ACDTM conducts adversarial self-training on
target domain with pseudo-labeled distribution. Our experimental findings substantiate that the unsupervised
accuracy achieves about 80$\sim$92% on different mmWave gesture datasets, outperforming existing unsupervised
HGR schemes by large margins. Code is available at https://github.com/onlinehuazai/mmGesture.

## Citation

Q. Feng, K. Cheng, and C. Duan, “mmWave Radar-Based Unsupervised Gesture Recognition via Image-Aligned Heterogeneous Domain Transfer,” IEEE Transactions on Mobile Computing (TMC), vol. 25, no. 3, pp. 3279-3296, 2026.

## 中文引用（GB/T 7714）

Feng Q, Cheng K, Duan C. mmWave Radar-based Unsupervised Gesture Recognition via Image-Aligned Heterogeneous Domain Transfer[J]. IEEE Transactions on Mobile Computing (TMC), 2026, 25(3): 3279-3296.
