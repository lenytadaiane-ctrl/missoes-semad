import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmar exclusão', message, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 text-sm mb-6">{message || 'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.'}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
        <button onClick={onConfirm} className="btn-danger" disabled={loading}>
          {loading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </Modal>
  );
}
