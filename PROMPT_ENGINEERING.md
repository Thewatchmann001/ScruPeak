# ScruPeak Prompt Engineering Guide

This document consolidates all AI prompt optimization strategies for the ScruPeak platform.

## Land Domain Context (Sierra Leone)
When interacting with LLMs for entity extraction or intent classification, always include the following context:
- **OARG**: Office of the Administrator and Registrar General.
- **Deed of Conveyance**: Primary legal instrument for title transfer.
- **Town Lot**: ~0.1 acre (5,000 sq ft).
- **SL-ID**: Parcel codes (e.g., SL-00100-01-02-0001).

## Mistral AI Optimization
Our internal AI service (Mistral) is tuned for high-fidelity extraction. 
Use the `LAND_DOMAIN_SYSTEM_PROMPT` located in `services/advanced_automation.py` for consistent results.

## Best Practices
1. **Terminology Hints**: Always provide hints like ["OARG", "Survey Plan", "Stamp Duty"] to improve zero-shot performance.
2. **Output Formatting**: Request JSON format explicitly to ensure compatibility with `DocumentExtractor`.
3. **Validation**: Use the `JemsAIService` moderation endpoint to verify generated guidance against local regulations.

## Deprecated Documentation
The following directories are now deprecated in favor of this file:
- `/vertex/prompt_optimizer/docs/`

---
*Last Updated: 2025-05-20*
*Engineering Contact: Google Dev Team*