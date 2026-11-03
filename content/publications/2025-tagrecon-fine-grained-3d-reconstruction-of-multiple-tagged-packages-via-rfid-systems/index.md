---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "TagRecon: Fine-Grained 3D Reconstruction of Multiple Tagged Packages via RFID Systems"
authors:
  - "Ziang Wang"
  - "me"
  - "Jiawei Xue"
  - "Fan Li"
  - "Qihua Feng"
  - "Yinan Zhu"
  - "Ziyang Zhou"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
  - ""
  - ""
  - ""
date: "2025-03-01T00:00:00Z"
publication_types: ["article-journal"]
publication:
  name: "ACM Transactions on Sensor Networks"
  short_name: "ACM TOSN"
  volume: "21"
  issue: "2"
  pages: "1-25"
peer_reviewed: true
featured: false
tags:
  - "CCF-B"
links:
  - type: pdf
    url: "/papers/2025-tagrecon-fine-grained-3d-reconstruction-of-multiple-tagged-packages-via-rfid-systems.pdf"
hugoblox:
  ids:
    doi: "10.1145/3715131"
---

## Abstract

To meet the new requirements of Industry 4.0, the logistics field has introduced 3D reconstruction technology.
Computer vision-based solutions face challenges like bad lighting conditions and line-of-sight constraints.
Meanwhile, the widespread adoption of RFID tags in supply chains offers an opportunity to enhance current
reconstruction methods. In this article, we propose TagRecon, a fine-grained multi-object 3D reconstruction
scheme utilizing well-deployed RFIDs. Specifically, TagRecon transforms the task of reconstruction into a
problem of estimating 3D bounding boxes for tagged packages. By placing dual anchor tags on each target
package, TagRecon enables accurate inference of the package’s translation and rotation using RFID-based
localization and orientation sensing. Our scheme introduces a novel method to estimate rotations and
translations for tagged packages, utilizing the known geometric relationship of anchor tags. Besides, to
achieve simultaneous reconstruction of multiple packages, we manage to match tags from various packages
through the correlation between anchor tag pairs. As far as we know, this is the first RFID-based solution
that can simultaneously realize 3D translation and rotation estimation of multiple objects to a fine
granularity. Experiments validate TagRecon achieves a 28.0 cm translation error and 6.8°, 6.0°, and 7.5°
rotation errors for roll, pitch, and yaw angles on average.

## Citation

Z. Wang, C. Duan, J. Xue, F. Li, Q. Feng, Y. Zhu, and Z. Zhou, “TagRecon: Fine-Grained 3D Reconstruction of Multiple Tagged Packages via RFID Systems,” ACM Transactions on Sensor Networks (TOSN), vol. 21, no. 2, pp. 1-25, 2025.

## 中文引用（GB/T 7714）

Wang Z, Duan C, Xue J, et al. TagRecon: Fine-Grained 3D Reconstruction of Multiple Tagged Packages via RFID Systems[J]. ACM Transactions on Sensor Networks (TOSN), 2025, 21(2): 1-25.
