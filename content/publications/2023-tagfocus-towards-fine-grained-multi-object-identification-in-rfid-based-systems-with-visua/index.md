---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "TagFocus: Towards Fine-Grained Multi-Object Identification in RFID-based Systems with Visual Aids"
authors:
  - "Junjie Yin"
  - "Zheng Yang"
  - "Sicong Liao"
  - "me"
  - "Xuan Ding"
  - "Li Zhang"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
  - ""
  - ""
date: "2023-02-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "ACM Transactions on Sensor Networks"
  short_name: "ACM TOSN"
  volume: "19"
  issue: "1"
  pages: "1-22"
peer_reviewed: true
featured: false
tags:
  - "CCF-B"
links:
  - type: pdf
    url: "/papers/2023-tagfocus-towards-fine-grained-multi-object-identification-in-rfid-based-systems-with-visua.pdf"
hugoblox:
  ids:
    doi: "10.1145/3526193"
---

## Abstract

Obtaining fine-grained spatial information is of practical importance in Radio Frequency Identification
(RFID)-based systems for enabling multi-object identification. However, as high-precision positioning remains
impractical in commercial-off-the-shelf (COTS)-RFID systems, researchers propose to combine computer vision
(CV) with RFID and turn the positioning problem into a matching problem. Promising though it seems, current
methods fuse CV and RFID through converting traces of tagged objects extracted from videos by CV into phase
sequences for matching, which is a dimension-reduced procedure causing loss of spatial resolution.
Consequently, they fail in harsh conditions like small tag intervals and low reading rates. To address the
limitation, we propose TagFocus to achieve fine-grained multi-object identification with visual aids in RFID
systems. The key observation is that traces generated through different methods shall be compatible if they
are of one identical object. Accordingly, a Transformer-based sequence-to-sequence (seq2seq) model is trained
to generate a simulated trace for each candidate tag-object pair. And the trace of the right pair shall best
match the observed trace directly extracted by CV. A prototype of TagFocus is implemented and extensively
assessed in lab environments. Experimental results show that our system maintains a matching accuracy of over
91% in harsh conditions, outperforming state-of-the-art schemes by 27%.

## Citation

J. Yin, Z. Yang, S. Liao, C. Duan, X. Ding, and L. Zhang, “TagFocus: Towards Fine-Grained Multi-Object Identification in RFID-based Systems with Visual Aids,” ACM Transactions on Sensor Networks (TOSN), vol. 19, no. 1, pp. 1-22, 2023.

## 中文引用（GB/T 7714）

Yin J, Yang Z, Liao S, et al. TagFocus: Towards Fine-Grained Multi-Object Identification in RFID-based Systems with Visual Aids[J]. ACM Transactions on Sensor Networks (TOSN), 2023, 19(1): 1-22.
