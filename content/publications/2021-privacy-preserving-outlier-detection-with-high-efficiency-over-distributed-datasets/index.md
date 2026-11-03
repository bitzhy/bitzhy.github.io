---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "Privacy-Preserving Outlier Detection with High Efficiency over Distributed Datasets"
authors:
  - "Guanghong Lu"
  - "me"
  - "Guohao Zhou"
  - "Xuan Ding"
  - "Yunhao Liu"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
  - ""
date: "2021-05-10T00:00:00Z"
publication_types: ["paper-conference"]
publication:
  name: "IEEE International Conference on Computer Communications"
  short_name: "IEEE INFOCOM"
  pages: "1-10"
  location: "Virtual Conference"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
links:
  - type: pdf
    url: "/papers/2021-privacy-preserving-outlier-detection-with-high-efficiency-over-distributed-datasets.pdf"
hugoblox:
  ids:
    doi: "10.1109/INFOCOM42981.2021.9488710"
---

## Abstract

The ability to detect outliers is crucial in data mining, with widespread usage in many fields, including
fraud detection, malicious behavior monitoring, health diagnosis, etc. With the tremendous volume of data
becoming more distributed than ever, global outlier detection for a group of distributed datasets is
particularly desirable. In this work, we propose PIF (Privacy-preserving Isolation Forest), which can detect
outliers for multiple distributed data providers with high efficiency and accuracy while giving certain
security guarantees. To achieve the goal, PIF makes an innovative improvement to the traditional iForest
algorithm, enabling it in distributed environments. With a series of carefully-designed algorithms, each
participating party collaborates to build an ensemble of isolation trees efficiently without disclosing
sensitive information of data. Besides, to deal with complicated real-world scenarios where different kinds of
partitioned data are involved, we propose a comprehensive schema that can work for both horizontally and
vertically partitioned data models. We have implemented our method and evaluated it with extensive
experiments. It is demonstrated that PIF can achieve comparable AUC to existing iForest on average and
maintains a linear time complexity without privacy violation.

## Citation

G. Lu, C. Duan, G. Zhou, X. Ding, and Y. Liu, “Privacy-Preserving Outlier Detection with High Efficiency over Distributed Datasets,” in Proceedings of the IEEE International Conference on Computer Communications (INFOCOM), 2021, pp. 1-10.

## 中文引用（GB/T 7714）

Lu G, Duan C, Zhou G, et al. Privacy-Preserving Outlier Detection with High Efficiency over Distributed Datasets[C]//Proceedings of the IEEE International Conference on Computer Communications (INFOCOM). 2021:1-10.
