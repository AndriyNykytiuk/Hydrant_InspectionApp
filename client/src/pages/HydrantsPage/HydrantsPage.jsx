import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listHydrants,
  deleteHydrant,
  downloadQrSheetPdf,
  downloadDefectActDocx,
  downloadAllDefectActDocx,
} from '../../api/hydrants.js';
import { listBrigades } from '../../api/brigades.js';
import { extractError } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Filters } from '../../components/Filters/Filters.jsx';
import { HydrantCard } from '../../components/HydrantCard/HydrantCard.jsx';
import { InspectionModal } from '../../components/InspectionModal/InspectionModal.jsx';
import { HydrantEditModal } from '../../components/HydrantEditModal/HydrantEditModal.jsx';
import { InspectionResultModal } from '../../components/InspectionResultModal/InspectionResultModal.jsx';
import { DefectActModal } from '../../components/DefectActModal/DefectActModal.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { Spinner } from '../../components/Spinner/Spinner.jsx';
import { Select } from '../../components/Input/Input.jsx';
import './HydrantsPage.scss';

export function HydrantsPage() {
  const navigate = useNavigate();
  const { user, isGod, isViewer, canViewAll } = useAuth();
  const [hydrants, setHydrants] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: '', networkType: '', brigadeId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspecting, setInspecting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [reportBrigadeId, setReportBrigadeId] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [resultHydrant, setResultHydrant] = useState(null);
  const [actModalOpen, setActModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.networkType) params.networkType = filters.networkType;
      if (canViewAll && filters.brigadeId) params.brigadeId = filters.brigadeId;
      const data = await listHydrants(params);
      setHydrants(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.q, filters.status, filters.networkType, filters.brigadeId]);

  useEffect(() => {
    listBrigades()
      .then((b) => {
        setBrigades(b);
        if (!canViewAll) {
          setReportBrigadeId(user?.brigadeId || '');
        } else if (b.length === 1) {
          setReportBrigadeId(b[0].id);
        }
      })
      .catch(() => setBrigades([]));
  }, [canViewAll, user?.brigadeId]);

  const onSavedInspection = () => {
    setInspecting(null);
    load();
  };

  const onSavedHydrant = () => {
    setEditOpen(false);
    setEditing(null);
    load();
  };

  const onDelete = async (h) => {
    if (!confirm(`Видалити гідрант №${h.number}? Дія м'яка — гідрант можна відновити в БД.`)) {
      return;
    }
    try {
      await deleteHydrant(h.id);
      load();
    } catch (err) {
      alert(extractError(err));
    }
  };

  const uniqueAddresses = useMemo(() => {
    const collator = new Intl.Collator('uk', { numeric: true, sensitivity: 'base' });
    const set = new Set();
    for (const h of hydrants) {
      if (h.address) set.add(h.address);
    }
    return Array.from(set).sort(collator.compare);
  }, [hydrants]);

  useEffect(() => {
    if (selectedAddress && !uniqueAddresses.includes(selectedAddress)) {
      setSelectedAddress(null);
    }
  }, [uniqueAddresses, selectedAddress]);

  const displayedHydrants = useMemo(
    () =>
      selectedAddress
        ? hydrants.filter((h) => h.address === selectedAddress)
        : hydrants,
    [hydrants, selectedAddress]
  );

  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const handleDownload = async (kind) => {
    if (!reportBrigadeId) return;
    if (kind === 'report') {
      setActModalOpen(true);
      return;
    }
    setDownloadingPdf(kind);
    try {
      await downloadQrSheetPdf(reportBrigadeId);
    } catch (err) {
      alert(extractError(err));
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleActSubmit = async (representativeSurname) => {
    setDownloadingPdf('report');
    try {
      if (reportBrigadeId === 'all') {
        await downloadAllDefectActDocx({ representativeSurname });
      } else {
        await downloadDefectActDocx(reportBrigadeId, { representativeSurname });
      }
    } catch (err) {
      throw new Error(extractError(err));
    } finally {
      setDownloadingPdf(null);
    }
  };

  return (
    <div className="hydrants-page">
      <div className="hydrants-page__header">
        <div>
          <h1 className="hydrants-page__title">
            В районі виїзду {brigades.find((b) => String(b.id) === String(filters.brigadeId))?.name || ''} знаходиться    {!loading && (
              <span className="hydrants-page__count" title="Кількість гідрантів у поточній вибірці">
                {hydrants.length}
              </span>
            )} пожежних гідрантів.
         
          </h1>
          <p className="hydrants-page__subtitle">
            {canViewAll
              ? filters.brigadeId
                ? `Частина: ${brigades.find((b) => String(b.id) === String(filters.brigadeId))?.name || ''}`
                : 'Усі частини'
              : `Частина: ${user?.brigade?.name || ''}`}
            {isViewer && ' · режим перегляду'}
          </p>
        </div>
        <div className="hydrants-page__report-actions">
          {canViewAll && (
            <Select
              value={reportBrigadeId}
              onChange={(e) => setReportBrigadeId(e.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="">Частина для звіту</option>
              <option value="all">Усі частини (зведений)</option>
              {brigades.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          {reportBrigadeId && (
            <>
              {reportBrigadeId !== 'all' && (
                <Button
                  variant="secondary"
                  onClick={() => handleDownload('qr')}
                  disabled={downloadingPdf === 'qr'}
                >
                  {downloadingPdf === 'qr' ? 'Готую PDF...' : 'PDF з QR'}
                </Button>
              )}
              {canViewAll && (
                <Button
                  onClick={() => handleDownload('report')}
                  disabled={downloadingPdf === 'report'}
                >
                  {downloadingPdf === 'report' ? 'Формую акт...' : 'Сформувати акт'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Filters
        value={filters}
        onChange={setFilters}
        brigades={brigades}
        showBrigadeFilter={canViewAll}
      />

      {uniqueAddresses.length > 0 && (
        <div className="hydrants-page__addresses">
          <Button
            variant={selectedAddress === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedAddress(null)}
          >
            Усі адреси
          </Button>
          {uniqueAddresses.map((addr) => (
            <Button
              key={addr}
              variant={selectedAddress === addr ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedAddress(addr)}
            >
              {addr}
            </Button>
          ))}
        </div>
      )}

      {error && <div className="hydrants-page__error">{error}</div>}

      {loading ? (
        <div className="hydrants-page__loading">
          <Spinner /> Завантаження...
        </div>
      ) : displayedHydrants.length === 0 ? (
        <div className="hydrants-page__empty">Гідранти не знайдено</div>
      ) : (
        <div className="hydrants-page__grid">
          {displayedHydrants.map((h) => (
            <HydrantCard
              key={h.id}
              hydrant={h}
              canManage={isGod}
              canInspect={!isViewer}
              onInspect={(hh) => setInspecting(hh)}
              onEdit={(hh) => {
                setEditing(hh);
                setEditOpen(true);
              }}
              onDelete={onDelete}
              onShowResult={(hh) => setResultHydrant(hh)}
            />
          ))}
        </div>
      )}

      <InspectionModal
        open={!!inspecting}
        hydrant={inspecting}
        onClose={() => setInspecting(null)}
        onSaved={onSavedInspection}
      />

      <HydrantEditModal
        open={editOpen}
        hydrant={editing}
        brigades={brigades}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onSaved={onSavedHydrant}
      />

      <InspectionResultModal
        open={!!resultHydrant}
        hydrant={resultHydrant}
        onClose={() => setResultHydrant(null)}
        onOpenDetail={(h) => navigate(`/hydrants/${h.id}`)}
      />

      <DefectActModal
        open={actModalOpen}
        onClose={() => setActModalOpen(false)}
        onSubmit={handleActSubmit}
        target={
          reportBrigadeId === 'all'
            ? 'Зведений акт по всіх частинах'
            : `Частина: ${brigades.find((b) => String(b.id) === String(reportBrigadeId))?.name || ''}`
        }
      />
    </div>
  );
}
