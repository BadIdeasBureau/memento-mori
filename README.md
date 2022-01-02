# Memento Mori
A module for Foundry VTT.

When installed, this module will automatically mark tokens with a configurable status effect when they run out of health.  The status effect name and icon can be set by the user, and a different effect can be used for linked or unlinked tokens (e.g. dead vs dying).

The module is set up out-of-the-box for dnd5e and systems which use the same path for an actor's HP (`data.data.attributes.hp.value`), which should include PF1 and PF2.  There are settings to configure which will allow the attribute path being monitored to be changed, as well as the check (so e.g. if your system requires marking a token dead/dying when their `wounds` are greater than their `maxWounds`, that can be done).  More complex setups (e.g. "a token is dead if each of its 6 stats is marked") are not supported.


Icons from game-icons.net

Bleeding Wound and Pirate grave icon by [Lorc](https://lorcblog.blogspot.com/) under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/), from http://game-icons.net