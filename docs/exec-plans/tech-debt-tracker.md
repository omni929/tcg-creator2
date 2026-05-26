# Tech Debt Tracker

| Item | Impact | Next Action |
| --- | --- | --- |
| No UI smoke test | Refactors can break workflows silently | Add browser smoke test for the studio shell |
| No deep project JSON validation | Bad imports may create strange state | Add schema validation at import boundary |
| Large production bundle | Slower loading over time | Split heavy rendering path when app grows |
