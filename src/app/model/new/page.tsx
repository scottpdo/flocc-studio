import { redirect } from 'next/navigation';

/**
 * /model/new redirects to the editor
 */
export default function NewModelPage() {
  redirect('/model/new/edit');
}
