import { handleLead } from '../../src/lib/lead-handler';

export async function POST({ request, env }: { request: Request; env: any }) {
  return handleLead(request, env, 'contato');
}
