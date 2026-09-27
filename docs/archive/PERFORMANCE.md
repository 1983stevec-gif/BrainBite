# BrainBite v1.2 Performance Notes

Targets for beta playtesting:
- first interactive paint under 2.5s on typical home broadband
- no gameplay dependency on network after first cached load
- keep active board objects under 100
- avoid per-frame allocations in the grid loop
- save only on meaningful state changes and visibility loss
- preload only current-world essentials
- lazy-load future production art/audio

Current prototype remains DOM-grid based. If animation demands outgrow this, migrate the gameplay surface to Phaser while preserving the same learning/content APIs.
