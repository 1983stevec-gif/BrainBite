# Gate 8.5 — Legal clause map (agent pre-read)

Status: draft for counsel. **Does not replace** signature in `GATE_8_5_REVIEW_PACKET.md` §C.

App under review: shipping `?match=0&webgl=0`.

| Topic | Where stated | In-product control | Counsel note |
| --- | --- | --- | --- |
| Child progress local storage | `privacy.html` → What We Store | Profiles / Recovery | |
| Optional Firebase family sync | `privacy.html` → What We Store | Account & Sync / Integrations | Project `brainbite-prod` |
| No ads / no public child profiles | `privacy.html` → What We Do Not Use | N/A | |
| Parent role / PIN | `privacy.html` → Parent Controls; Parent screen | Parent PIN unlock; Controls / Account / Integrations / Lab gated | Default PIN `1234` must be changed in production guidance |
| Export | `privacy.html` Parent Controls; `support.html` | `#exportActiveProfile`, `#exportBtn`, `#exportCloudSnapshot` | Local smoke PASS |
| Deletion | `privacy.html` Parent Controls | `#deleteCloudAccount`, `#deleteActiveProfile` | Prod verify still required (Gate 8.6) |
| Support channel | `support.html` | Footer Support link | **Interim** GitHub Issues until production email |
| Terms acceptable use | `terms.html` | Footer Terms | |
| Draft disclaimer | Privacy / Terms / Support flags | N/A | Pages still say legal review required |

Open product flags for counsel:

1. Support is not production-email-ready.
2. Privacy/Terms still labeled draft.
3. Account deletion must be verified live on `brainbite-prod`.
