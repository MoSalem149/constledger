import OpenAI from 'openai';
import { ContractExtraction } from '../../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a construction contract analysis expert.
Extract all requested fields from the contract text and return ONLY a valid JSON object.
If a field cannot be found or determined, set its value to null — do NOT guess.
Return no text outside the JSON object.`;

const USER_PROMPT = (text: string) => `Extract the following fields from this construction contract:
- parties (Array of {name, role})
- contract_value (number)
- currency (string, e.g. "USD")
- unit_prices (Array of {item, unit, unit_price})
- payment_terms (string summary)
- payment_schedule (Array of {date: "YYYY-MM-DD", amount})
- start_date ("YYYY-MM-DD")
- end_date ("YYYY-MM-DD")
- duration_days (number)
- reporting_period ("weekly" or "monthly")
- milestones (Array of {name, due_date: "YYYY-MM-DD"})
- penalties (Array of {condition, penalty})

Contract text:
${text.slice(0, 80000)}`; // Truncate to avoid token limits

export async function extractContractData(contractText: string): Promise<ContractExtraction> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: USER_PROMPT(contractText) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error('LLM returned empty response');

  return JSON.parse(raw) as ContractExtraction;
}
