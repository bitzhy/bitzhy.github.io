---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "EViT: Privacy-Preserving Image Retrieval via Encrypted Vision Transformer in Cloud Computing"
authors:
  - "Qihua Feng"
  - "Peiya Li"
  - "Zhixun Lu"
  - "Chaozhuo Li"
  - "Zefan Wang"
  - "Zhiquan Liu"
  - "me"
  - "Feiran Huang"
  - "Jian Weng"
  - "Philip S Yu"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
  - ""
  - ""
  - ""
  - "Corresponding author"
  - ""
  - ""
date: "2024-08-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "IEEE Transactions on Circuits and Systems for Video Technology"
  short_name: "IEEE TCSVT"
  volume: "34"
  issue: "8"
  pages: "7467-7483"
peer_reviewed: true
featured: false
tags:
  - "CCF-B"
  - "中科院一区"
links:
  - type: pdf
    url: "/papers/2024-evit-privacy-preserving-image-retrieval-via-encrypted-vision-transformer-in-cloud-computin.pdf"
hugoblox:
  ids:
    doi: "10.1109/TCSVT.2024.3370668"
---

## Abstract

Image retrieval systems help users to browse and search among extensive images in real time. With the rise of
cloud computing, retrieval tasks are usually outsourced to cloud servers. However, the cloud scenario brings a
daunting challenge of privacy protection as cloud servers cannot be fully trusted. To this end,
image-encryption-based privacy-preserving image retrieval (PPIR) schemes have been developed, which first
extract features from cipher-images, and then build retrieval models based on these features. Yet, most
existing PPIR approaches extract shallow features and design trivial unsupervised retrieval models, resulting
in insufficient expressiveness for the cipher-images. In this paper, we propose a novel paradigm named
Encrypted Vision Transformer (EViT), which advances the discriminative representations capability of
cipher-images. First, to capture comprehensive ruled information, we extract multi-level local length sequence
and global Huffman-Code frequency features from the cipher-images which are encrypted by permutation
encryption, sign encryption, and stream cipher during the JPEG compression process. Second, we design the
modified self-supervised Vision Transformer with Huffman-embedding and propose two robust data augmentations
on cipher-images to improve representation power of the retrieval model. Moreover, our proposal can be easily
adapted to unsupervised or supervised settings. Extensive experiments reveal that EViT achieves both excellent
encryption and retrieval performance, outperforming current schemes in terms of retrieval accuracy by large
margins while protecting image privacy effectively. Code is publicly available at
https://github.com/onlinehuazai/EViT.

## Citation

Q. Feng, P. Li, Z. Lu, C. Li, Z. Wang, Z. Liu, C. Duan, F. Huang, J. Weng, and P. Yu, “EViT: Privacy-Preserving Image Retrieval via Encrypted Vision Transformer in Cloud Computing,” IEEE Transactions on Circuits and Systems for Video Technology (TCSVT), vol. 34, no. 8, pp. 7467-7483, 2024.

## 中文引用（GB/T 7714）

Feng Q, Li P, Lu Z, et al. EViT: Privacy-Preserving Image Retrieval via Encrypted Vision Transformer in Cloud Computing[J]. IEEE Transactions on Circuits and Systems for Video Technology (TCSVT), 2024, 34(8): 7467-7483.
