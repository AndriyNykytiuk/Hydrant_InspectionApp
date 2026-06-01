import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getHydrant } from '../../api/hydrants.js';
import { extractError } from '../../api/client.js';
import { InspectionForm } from '../../components/InspectionForm/InspectionForm.jsx';
import { Spinner } from '../../components/Spinner/Spinner.jsx';
import { Button } from '../../components/Button/Button.jsx';
import './InspectPage.scss';

export function InspectPage() {
  const { hydrantId } = useParams();
  const navigate = useNavigate();
  const [hydrant, setHydrant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getHydrant(hydrantId)
      .then(setHydrant)
      .catch((err) => setError(extractError(err)))
      .finally(() => setLoading(false));
  }, [hydrantId]);

  if (loading) {
    return (
      <div className="inspect-page__loading">
        <Spinner /> Завантаження гідранта...
      </div>
    );
  }

  if (error) {
    return (
      <div className="inspect-page__error">
        <h2>Помилка</h2>
        <p>{error}</p>
        <Button onClick={() => navigate('/hydrants')}>До списку гідрантів</Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="inspect-page__success">
        <div className="inspect-page__success-icon">✓</div>
        <h2>Перевірку збережено</h2>
        <p>Гідрант № {hydrant.number}, {hydrant.address}</p>
        <div className="inspect-page__success-actions">
          <Button onClick={() => navigate('/hydrants')}>До списку</Button>
          <Button variant="secondary" onClick={() => navigate(`/hydrants/${hydrant.id}`)}>
            Деталі гідранта
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="inspect-page">
      <h1 className="inspect-page__title">Перевірка гідранта</h1>
      <InspectionForm
        hydrant={hydrant}
        onSaved={() => setSuccess(true)}
      />
    </div>
  );
}
