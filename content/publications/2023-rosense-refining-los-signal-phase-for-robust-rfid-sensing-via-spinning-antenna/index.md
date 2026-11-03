---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "RoSense: Refining LOS Signal Phase for Robust RFID Sensing via Spinning Antenna"
authors:
  - "Yinan Zhu"
  - "me"
  - "Xuan Ding"
author_notes:
  - ""
  - "Corresponding author"
  - ""
date: "2023-04-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "ACM SIGMETRICS Performance Evaluation Review"
  short_name: "ACM SIGMETRICS PER"
  volume: "50"
  issue: "4"
  pages: "53-55"
peer_reviewed: true
featured: false
links:
  - type: pdf
    url: "/papers/2023-rosense-refining-los-signal-phase-for-robust-rfid-sensing-via-spinning-antenna.pdf"
hugoblox:
  ids:
    doi: "10.1145/3595244.3595263"
---

## Abstract

RFID sensing leveraging backscatter signal features (e.g., phase shift) from tags has gained increasing
popularity in numerous applications, but also suffers from negative impacts of environmental multipaths. Past
works to address it rely on extra customized devices, labor-intensive offine training or frequency channel
hopping, all of which are nonubiquitous or ineffective for real-life adoption. This paper presents RoSense, a
universal method to alleviate multipath reflections' impacts by spinning the reader antenna, thus enabling
more robust RFID sensing. Besides, RoSense requires no RF devices or offline training, and operates in a
nonintrusive manner. The key insight of RoSense is to exploit two properties of line-of-sight (LOS) signal
when spinning the antenna, i.e., the linearity of phase changes and stability of received signal strength to
attenuate the non-linear and non-monotonic effect of multipath signals and refine the phase shift of LOS
signal. We have implemented a prototype of RoSense with COTS devices and studied two cases for evaluation:
material identification and object localization. Experimental results show that RoSense can improve the
material identification accuracy by 16.22% and reduce the mean localization error by 39.93%, greatly
outperforming the state-of-the-art solutions.

## Citation

Y. Zhu, C. Duan, and X. Ding, “RoSense: Refining LOS Signal Phase for Robust RFID Sensing via Spinning Antenna,” ACM SIGMETRICS Performance Evaluation Review (PER), vol. 50, no.4, pp. 53-55, 2023.

## 中文引用（GB/T 7714）

Zhu Y, Duan C, Ding X. RoSense: Refining LOS Signal Phase for Robust RFID Sensing via Spinning Antenna[J]. ACM SIGMETRICS Performance Evaluation Review (PER), 2023, 50(4): 53-55.
