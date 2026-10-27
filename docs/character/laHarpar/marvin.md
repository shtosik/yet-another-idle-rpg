# Marvin — Exploration Guild member (La Harpar)

## Personality
Professional, direct, mission-focused. Structures the world for the player in concrete systems (contracts, Explorer Tokens, unlock gates) rather than gossip or lore. Encouraging without flattery ("Fine work out there!"). The one villager Elara and the Trader both single out as competent.

## Avatar concept — DONE
Existing portrait (`laHarparMarvin.png`): scarred veteran warrior, auburn hair and beard, grey plate pauldrons, orange scarf. Reads as a capable ex-adventurer, matches his no-nonsense contract-broker tone. No changes needed.

## Redesign: Guild member, stays in La Harpar (proposed, `docs/ideas/north-lirold-and-exploration-guild.md` §5)
Owner decision (2026-10-27): Marvin stays in La Harpar for good. The Exploration Guild's hall and head are in Lirold under Guildmaster Odile Varrow (`docs/character/lirold/varrow.md`).

- **Who:** a Guild member, La Harpar-born, home "a few days ago" from an expedition Varrow sent him on (`Elara#marvinInfo`, `Trader#aboutPeople`). Not the Guild's head: shipped "head of the Exploration Guild" (`Marvin#introduction1`) changes to "of the Exploration Guild".
- **Where:** the La Harpar **Tavern** (the La Harpar Guild building is removed). Fits `Bartender#anyoneWhoCanTrainMe1` ("You can usually find him nearby").
- **Role:** tells the player the Guild exists and that the hall in Lirold has more in stock; until the player has met Varrow (flag `met_liroldVarrow`) he handles contracts (accept, claim, cancel) and sells the Guild store's stage-0 items, then he redirects to her. Always teaches combat (tips branch, the "combat training" the Bartender and Elara mention).
- **Voice:** keeps his shipped habits. Leads with the job and talks in systems and numbers ("Every 5 completed contracts"). Short imperatives when teaching ("Fall back a few waves, get stronger, come back"). Dry, not jokey. Praise is earned and brief ("Clean work."). Calls tasks "contracts". Never gossips; turns personal questions back to Guild business. Speaks of Varrow with respect and a little wariness ("ask her, and watch her not answer").
- **Letters:** writes to Varrow about the player; she quotes them in the capital (deed lines).
- **Secret:** won't say where his last expedition went (thread T-17); that is between him and Varrow.
