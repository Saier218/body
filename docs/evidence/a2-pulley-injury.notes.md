# A2 pulley evidence table: gaps, contradictions, differing numbers

Companion to `a2_pulley_evidence.json` (45 sources, 151 claims). Retrieved 2026-11-16 via the Europe PMC REST API only.

## How to read the table

- `confidence: read_fulltext` means the passage was read in the article's full-text XML. For 9 of the 14 full-text sources only the relevant sections were read; `read_level` on each source says which.
- `confidence: read_abstract` means only the abstract was available. 31 sources are abstract-only.
- Every quote was machine-checked as a contiguous substring of the saved source text (ignoring whitespace and punctuation). Table quotes have " / " added between cells.
- `is_primary: false` plus `cited_reference` marks second-hand statements. I did not open most cited references, so those are relayed, not verified.
- Licences are as stated in each article's XML. Six are CC BY-NC or CC BY-NC-ND (Berrigan 2022, Simon 2022, Mergoum 2025, Vagy 2026, Schöffl 2025 adolescent, Ehiogu 2025). Facts can be paraphrased from them; their figures and wording must not be reused.

## Could NOT be found or verified

1. **The original Schöffl 2003 grading table and its return-to-climbing table.** The paper (Wilderness Environ Med 2003;14:94-100) is not open access. Only its abstract was read: grades 1-4 exist, grades 1-3 conservative, grade 4 surgical, and the grade distribution. Per-grade definitions and timelines in the JSON are second-hand:
   - Larsson 2022, Table 1, explicitly "Modified from Schöffl et al." (it adds the thermoplastic ring for grade 3, which the same paper attributes to later research).
   - Mergoum 2025, Table 2, which cites a ball-sports hand review (Netscher 2017), so it is third-hand.
   - Iruretagoiena 2023, citing Lutter 2021.
2. **The updated grading with 4a/4b** (Lutter, Tischer, Schöffl, BJSM 2021; and the 2021 "Climbing Medicine" book chapter). Only the BJSM abstract was available and it does not contain the grading. Seen only as relayed by Simon 2022.
3. **Miro 2021** (Wilderness Environ Med), the most-cited current review: abstract only. Its treatment table was not read.
4. **Crowley 2012, Bosco 2022, Artiaco 2023, Lum 2019, Grandizio 2017, Jaini 2026**: Europe PMC full text returned HTTP 500 and the PMC website returned a browser check page. Abstract only. I did not try to get around this.
5. **No consensus statement or clinical guideline on pulley injury was found.** The closest is an e-Delphi *protocol* (Ehiogu 2025); its results were not found.
6. **Sources for the load figures 380 N / 450 N (foot slip)**: attributed by Larsson to Schweizer 2000 and Bollen 1990. Neither abstract contains those numbers.
7. **"Audible pop"**: only found second-hand (Berrigan citing Crowley; King 2017 abstract; Meyers citing Rohrbough 2000). No primary study reporting how often it occurs was found.
8. **Which finger**: "ring, then middle" rests on Bollen 1988 and Bollen & Gunson 1990, both unread. No modern primary frequency-by-finger data was read.
9. **Incidence per 1000 climbing hours for pulley injury specifically**: not found.
10. **Evidence that any prevention measure reduces pulley injury specifically**: not found. Quarmby 2023 covers overuse injuries overall, not pulleys.
11. **Adolescent pulley red flags as such**: the literature read does not give a list of "red flags". Topic 6 collects situations where sources say specialist assessment, imaging or surgery is indicated; turning them into a red-flag list is an editorial step that needs expert review.
12. **Thermoplastic ring / pulley-protection splint protocol details**: only the Schneeberger 2016 abstract (outcomes) was read.

## Contradictions between sources

1. **Which imaging is the reference standard.** Berrigan 2022, Miro 2021, Iruretagoiena 2020/2023/2024 and Simon 2022: ultrasound first, MRI if unclear. Mergoum 2025 (general sports medicine): "MRI is the gold standard", ultrasound an alternative. The climbing-specific sources agree with each other.
2. **Which pulley is injured most.** Most introductions say A2, then A4. The Schöffl 2015 abstract (911 injuries, 2009-2012) says there were "now more A4 pulley injuries than A2". Iruretagoiena 2024 cites that same paper for "A2 most frequently affected".
3. **Does the crimp grip rupture A2?** Vigouroux 2006 (model): A2 force 36 times higher in crimp than slope. Schöffl I 2009 (cadaver): A2 287 N vs 121 N, about 2.4 times, and A4 rupture was the most frequent event in crimp. Eccentric loading, not grip alone, gave A2 rupture most often (Schöffl I 2009, eccentric study).
4. **Are complete A2 ruptures common?** Schöffl 2003: 30% grade 3. Mohn 2026 (34 consecutive patients): none complete, median 63.6% of the pulley torn; that clinic simplified the grading. Iruretagoiena 2023 also shows partial ruptures exceeding the 2 mm "complete" threshold, so older series may have over-called complete ruptures. This is my reading, not stated by a source.
5. **Grade 4 / multiple ruptures always surgical?** Schöffl 2003, Schöffl 2006, King 2017: surgery. Miro 2021: surgery only if not amenable to conservative treatment. Scheibler 2021: early conservative treatment of triple ruptures gave return to previous level in 7 patients. Simon 2022: surgery if older than 10 days or bowstringing not reducible.
6. **Grade 3.** Schöffl: conservative. Bosco 2022: "grey area". Mergoum 2025: surgery possible if bowstringing is clinically apparent or healing is slow.
7. **Bowstringing as a sign.** King 2017 and Simon 2022: visible bowstringing only with multiple ruptures. Berrigan 2022: bowstringing "indicative of a major A2 pulley injury". El-Sheikh 2006: clinical bowstringing testing not supported by evidence. Grandizio 2017: degree of rupture needed is controversial.
8. **Warm-up.** Miro 2021: "thought to prevent injury" (mechanistic basis: Schweizer 2001, 16 fingers). Quarmby 2023: no protective effect in four studies; one prospective study found higher odds with finger warm-up, attributed to confounding.
9. **Taping.** For treatment after injury, H-tape reduced tendon-bone distance in small trials and is recommended by its developers (Schöffl I 2007). Larsson 2022: evidence too weak for any definite recommendation. For prevention: Warme 2000, Schweizer 2000 and Quarmby 2023 do not support it; Zieliński 2025 reports taping associated with *more* injuries in youth, read as confounding by indication.
10. **Number of cruciate pulleys.** Larsson, Iruretagoiena, Simon: C1-C3. Berrigan (figure legend) and Mergoum: C1-C4.
11. **Growth-plate injury pain location.** Bärtschi 2019 and Jones 2022: dorsal PIP joint. The Schöffl 2025 classification table reads "tenderness over the dorsal distal phalanx", which does not match the fracture site the same paper describes (dorsal base of the middle phalanx). Possibly a typo in that paper; I did not use the table wording.

## Numbers that differ across papers

| Item | Values | Sources |
|---|---|---|
| Pulley injuries as share of all climbing injuries | 20.2% (122 of 604 injured climbers, one clinic, 1998-2001) | Schöffl 2003 abstract |
| | 15-20% | Larsson 2022, citing Schöffl 2015 |
| | "up to 20%" | Manjunathan 2026 abstract |
| | "up to 33%" | Iruretagoiena 2020 and 2023, citing King 2017 |
| | A2 involved in 26% of climbers (survey prevalence, not share of injuries) | Berrigan 2022, citing Rohrbough 2000 |
| | A2 rupture 49% in skeletally mature athletes | Meyers 2020, citing Schöffl 2015; not in that abstract, denominator unclear |
| Return to climbing, grade 1 | 6-8 weeks (grades 1-2 together) | Larsson 2022 |
| | light 2-6 weeks, full after 6 weeks | Mergoum 2025 |
| Grade 2 | 6-8 weeks | Larsson 2022 |
| | full after 8-10 weeks | Mergoum 2025; Iruretagoiena 2023 citing Lutter 2021 |
| Grade 3 | 3 months | all three |
| Grade 4 | about 6 months after surgery | Mergoum 2025 |
| | full load 6-9 months after surgery | Simon 2022 |
| Observed outcomes | 90-91% back at 3 months (grades 1-3) | Larsson 2022 on Schöffl 2003/2004 |
| | previous level at mean 8.8 months (complete ruptures) | Schneeberger 2016 |
| | "within a year" | Schöffl 2006 MSSE |
| Protective taping duration | 3 months (grades 1-2), 6 months (grade 3) | Larsson 2022 |
| | 3 months (grades I-III), at least 12 months (grade IV) | Mergoum 2025 citing Miro 2021 |
| | 6 further months after surgery | Simon 2022 |
| Tendon-bone distance for complete A2 rupture | range in use 1.9-5.1 mm | Iruretagoiena 2020 systematic review |
| | >2 mm "most used" | Iruretagoiena 2023 |
| | >=3 mm | Klauser 2002 as tabulated by Berrigan |
| | above 3 mm suggested | Iruretagoiena 2023 own data |
| Partial A2 rupture | <3 mm (Klauser), 0-3 mm (Hauger), <2 mm (Schöffl 2003), >2.2 mm (Bodner) | Berrigan 2022; Iruretagoiena 2023 |
| Any pulley injury | >1.0 mm | Klauser 2002 abstract |
| Minimum distance in simulated partial rupture | 1.6 mm in the abstract, 1.67 mm in Results | Iruretagoiena 2023 (internal inconsistency) |
| A2 load in climbing | up to 116 N measured | Schweizer 2001 abstract |
| | up to 380 N habitual, 450 N on foot slip | Larsson 2022 citing Schweizer 2000, Bollen 1990 |
| A2 rupture force (cadaver) | 153 N (pre-torn, age 50-98) to 569 N (intact, age 20-47) | Larsson 2022 |
| H-tape effect on tendon-bone distance | 16% | Schöffl I 2007 abstract |
| | 3.77 to 3.19 mm (about 15%) | Larsson 2022 on the same study |
| Growth-plate injury share in adolescents | 45.3% of 137 injuries | Schöffl 2025 |
| | 14 of 20 injured climbers under 15 | Schöffl 2015 |
| | 6% in a survey study | Schöffl 2025 discussing Chen et al. |
| Published case count of finger growth-plate stress injuries | 107 / "over 200" / 149 in 98 climbers | Schöffl 2025 classification / Schöffl 2024 / Jaini 2026 |

## Cautions for whoever writes the entry

- Almost all epidemiology and the grading system come from one referral centre (Bamberg, Schöffl group) and its co-authors; several "independent" citations trace back to the same two case series. The authors themselves note selection bias.
- Return-to-climbing times are estimates from uncontrolled cohorts. Larsson 2022 states natural recovery cannot be ruled out. Give ranges and say so.
- The grade definitions depend on imaging, so they describe a clinician's classification, not something a climber can self-assign.
- Many source sentences use treatment language ("requires surgical repair", "conservative treatment"). They are recorded verbatim as evidence; the app text will need rewording to stay descriptive.
- Two sources fetched by guessed PMID turned out unrelated (PMID 10949001, 23912146) and are not used. `schoffl2004` and `lum2019` were read as abstracts but not used for any claim.
