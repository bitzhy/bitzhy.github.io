---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "Tagspin: High Accuracy Spatial Calibration of RFID Antennas via Spinning Tags"
authors:
  - "me"
  - "Lei Yang"
  - "Qiongzheng Lin"
  - "Yunhao Liu"
author_notes:
  - "Corresponding author"
  - ""
  - ""
  - ""
date: "2018-10-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "IEEE Transactions on Mobile Computing"
  short_name: "IEEE TMC"
  volume: "17"
  issue: "10"
  pages: "2438-2451"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
  - "中科院一区"
links:
  - type: pdf
    url: "/papers/2018-tagspin-high-accuracy-spatial-calibration-of-rfid-antennas-via-spinning-tags.pdf"
hugoblox:
  ids:
    doi: "10.1109/TMC.2018.2796092"
---

## Abstract

Recent years have witnessed the advance of RFID-based localization techniques that demonstrate high precision.
Many efforts have been made locating RFID tags accurately with a mandatory assumption that the RFID reader's
position is known in advance. Unfortunately, calibrating reader's location manually is always time-consuming
and laborious in practice. In this paper, we present Tagspin, an approach using COTS tags to pinpoint the
reader (antenna) quickly and easily with high accuracy. Tagspin enables each tag to emulate a circular antenna
array by uniformly spinning on the edge of a rotating disk. We design an SAR-based method for estimating the
angle spectrum of the target reader. Compared to previous AoA-based techniques, we employ an enhanced power
profile modeling the relative signal power received from the reader along different spatial directions, which
is more accurate and immune to ambient noise as well as measurement errors caused by hardware characteristics.
Besides, we find that tag's phase measurements in practice are related to its orientation. To the best of our
knowledge, we are the first to point out this fact and quantify the relationship between them. By calibrating
the phase shifts caused by orientation, the positioning accuracy can be improved by 3:7×. We have implemented
Tagspin with COTS RFID devices and evaluated it extensively. Experimental results show that Tagspin achieves
mean accuracy of 7:3 cm with standard deviation of 1:8 cm in 3D space.

## Citation

C. Duan, L. Yang, Q. Lin, and Y. Liu, “Tagspin: High Accuracy Spatial Calibration of RFID Antennas via Spinning Tags,” IEEE Transactions on Mobile Computing (TMC), vol. 17, no. 10, pp. 2438-2451, 2018.

## 中文引用（GB/T 7714）

Duan C, Yang L, Lin Q, et al. Tagspin: High Accuracy Spatial Calibration of RFID Antennas via Spinning Tags[J]. IEEE Transactions on Mobile Computing (TMC), 2018, 17(10): 2438-2451.
