# Dino Ping

Agent lifecycle, flow authoring, lifecycle audio, integration Components,
self-account reads, Client provisioning, and guarded Client Preview.

Start with [SKILL.md](SKILL.md). It routes the agent to one task reference
after the [release/workspace gate](references/setup.md). Use native `dino`
for production or `dino-staging` for staging; each environment installs its
own manifest-selected skills/CLI pair.

The package contains instructions, schemas, and complete source examples.
Generated Components are excluded; build them inside a copied workspace
agent. There are no runtime package scripts or direct API fallbacks.

An Account Manager configures a Client's fixed Preview destination and resource
allocation. Only that Client can approve and place their real Preview call.
Provisioning uses default regional prepaid pricing, zero opening balance and
overdraft, and explicitly requested Widget concurrency. General processes and
account infrastructure belong to sibling Dino Pong; global administration
belongs to Dino Ops.

For website onboarding, read
[https://dino.dinodial.ai/dino.skill](https://dino.dinodial.ai/dino.skill).
Distribution readiness is tracked in the repository's root documentation;
a source checkout alone is not a verified installation.
