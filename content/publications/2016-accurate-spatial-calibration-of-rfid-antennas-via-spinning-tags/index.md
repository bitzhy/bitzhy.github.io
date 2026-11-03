---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "Accurate spatial calibration of RFID antennas via spinning tags"
authors:
  - "me"
  - "Lei Yang"
  - "Yunhao Liu"
author_notes:
  - "Corresponding author"
  - ""
  - ""
date: "2016-06-27T00:00:00Z"
publication_types: ["paper-conference"]
publication:
  name: "IEEE International Conference on Distributed Computing Systems"
  short_name: "IEEE ICDCS"
  pages: "519-528"
  location: "Nara, JAPAN"
peer_reviewed: true
featured: false
tags:
  - "CCF-B"
links:
  - type: pdf
    url: "/papers/2016-accurate-spatial-calibration-of-rfid-antennas-via-spinning-tags.pdf"
  - type: slides
    url: "/slides/2016-accurate-spatial-calibration-of-rfid-antennas-via-spinning-tags.pptx"
hugoblox:
  ids:
    doi: "10.1109/ICDCS.2016.32"
---

## Abstract

Recent years have witnessed the advance of RFID-based localization techniques that demonstrate high precision.
Many efforts have been made locating RFID tags with a mandatory assumption that the RFID reader's position is
known in advance. Unfortunately, calibrating reader's location manually is always time-consuming and laborious
in practice. In this paper, we present Tagspin, an approach using COTS tags to pinpoint the reader (antenna)
quickly and easily with high accuracy. Tagspin enables each tag to emulate a circular antenna array by
uniformly spinning on the edge of a rotating disk. We design an SAR-based method for estimating the angle
spectrum of the target reader. Compared to previous AoA-based techniques, we employ an enhanced power profile
modeling the signal power received from the reader along different spatial directions, which is more accurate
and immune to ambient noise as well as measurement errors caused by hardware characteristics. Besides, we find
that tag's phase measurements in practice are related to its orientation. To the best of our knowledge, we are
the first to point out this fact and quantify the relationship between them. By calibrating the phase shifts
caused by orientation, the positioning accuracy can be improved by 3.7×. We have implemented Tagspin withCOTS
RFID devices and evaluated it extensively. Experimentalresults show that Tagspin achieves mean accuracy of
7.3cm with standard deviation of 1.8cm in 3D space.

## Citation

C. Duan, L. Yang, and Y. Liu, “Accurate Spatial Calibration of RFID Antennas via Spinning Tags,” in Proceedings of the IEEE International Conference on Distributed Computing Systems (ICDCS), 2016, pp. 519-528.

## 中文引用（GB/T 7714）

Duan C, Yang L, Liu Y. Accurate Spatial Calibration of RFID Antennas via Spinning Tags[C]//Proceedings of the IEEE International Conference on Distributed Computing Systems (ICDCS). 2016: 519-528.
