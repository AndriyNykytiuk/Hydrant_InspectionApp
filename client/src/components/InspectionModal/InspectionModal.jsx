import { Modal } from '../Modal/Modal.jsx';
import { InspectionForm } from '../InspectionForm/InspectionForm.jsx';

export function InspectionModal({ open, hydrant, onClose, onSaved }) {
  if (!hydrant) return null;
  return (
    <Modal open={open} onClose={onClose} title="Перевірка гідранта" size="md">
      <InspectionForm hydrant={hydrant} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  );
}
