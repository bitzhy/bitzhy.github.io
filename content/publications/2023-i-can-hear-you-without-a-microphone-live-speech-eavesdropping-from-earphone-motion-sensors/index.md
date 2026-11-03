---
cms_migrated: true
build:
  render: never
  list: never
  publishResources: false
title: "I Can Hear You Without a Microphone: Live Speech Eavesdropping From Earphone Motion Sensors"
authors:
  - "Yetong Cao"
  - "Fan Li"
  - "Huijie Chen"
  - "Xiaochen Liu"
  - "me"
  - "Yu Wang"
author_notes:
  - ""
  - "Corresponding author"
  - ""
  - ""
  - ""
  - ""
date: "2023-05-17T00:00:00Z"
publication_types: ["paper-conference"]
publication:
  name: "IEEE International Conference on Computer Communications"
  short_name: "IEEE INFOCOM"
  pages: "1-10"
  location: "New York area, USA"
peer_reviewed: true
featured: false
tags:
  - "CCF-A"
links:
  - type: pdf
    url: "/papers/2023-i-can-hear-you-without-a-microphone-live-speech-eavesdropping-from-earphone-motion-sensors.pdf"
hugoblox:
  ids:
    doi: "10.1109/INFOCOM53939.2023.10228943"
---

## Abstract

Recent literature advances motion sensors mounted on smartphones and AR/VR headsets to speech eavesdropping
due to their sensitivity to subtle vibrations. The popularity of motion sensors in earphones has fueled a rise
in their sampling rate, which enables various enhanced features. This paper investigates a new threat of
eavesdropping via motion sensors of earphones by developing EarSpy, which builds on our observation that the
earphone’s accelerometer can capture bone conduction vibrations (BCVs) and ear canal dynamic motions (ECDMs)
associated with speaking; they enable EarSpy to derive unique information about the wearer’s speech.
Leveraging a study on the motion sensor measurements captured from earphones, EarSpy gains abilities to
disentangle the wearer’s live speech from interference caused by body motions and vibrations generated when
the earphone’s speaker plays audio. To enable user-independent attacks, EarSpy involves novel efforts,
including a trajectory instability reduction method to calibrate the waveform of ECDMs and a data augmentation
method to enrich the diversity of BCVs. Moreover, EarSpy explores effective representations from BCVs and
ECDMs, and develops a convolutional neural model with Connectionist Temporal Classification (CTC) to realize
accurate speech recognition. Extensive experiments involving 14 participants demonstrate that EarSpy reaches a
promising recognition for the wearer’s speech.

## Citation

Y. Cao, F. Li, H. Chen, X. Liu, C. Duan, and Y. Wang, “I Can Hear You Without a Microphone: Live Speech Eavesdropping From Earphone Motion Sensors, ” in Proceedings of the IEEE International Conference on Computer Communications (INFOCOM), 2023, pp. 1-10.

## 中文引用（GB/T 7714）

Cao Y, Li F, Chen H, et al. I Can Hear You Without a Microphone: Live Speech Eavesdropping From Earphone Motion Sensors[C]//Proceedings of the IEEE International Conference on Computer Communications (INFOCOM). 2023: 1-10.
