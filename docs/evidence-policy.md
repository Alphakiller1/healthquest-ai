# Evidence policy

The model may cite only source IDs that the server places in `allowedSourceIds` and that `validateAssistantResponse` finds in the active registry.

A source is active only after an HTTP 200 check from this project. Bot-blocked URLs stay `pending_review` and are not shown as citations.

Prefer U.S. sources for the U.S. product. WHO is included for general diet education and marked `INT`.

Claims, when added, must point at an evidence source, name the topic, and record a review date. The model does not invent URLs.
