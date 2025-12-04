import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/Header';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProductInfo } from '../types';
import { useTranslations } from '../i18n';

export const ProductInfoPage: React.FC = () => {
  const t = useTranslations();
  const productsMap = useAppStore(state => state.data.products);
  const addProduct = useAppStore(state => state.addProduct);
  const activeIds = useAppStore(state => state.activeIds);
  const setActiveId = useAppStore(state => state.setActiveId);
  const addToast = useAppStore(state => state.addToast);
  
  const products = useMemo(() => Object.values(productsMap) as ProductInfo[], [productsMap]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [location, setLocation] = useState('');

  const handleSave = () => {
    if (name.trim() === '') {
      addToast({type: 'error', message: t.toasts.productNameRequired})
      return;
    }
    addProduct({ name, price, desiredOutcome, location });
    setName('');
    setPrice('');
    setDesiredOutcome('');
    setLocation('');
  };

  return (
    <div>
      <Header
        title={t.productInfo.title}
        description={t.productInfo.description}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <Card>
          <h3 className="text-lg font-semibold mb-md">{t.productInfo.addNewProduct}</h3>
          <div className="space-y-md">
            <Input label={t.productInfo.productName} id="productName" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.productInfo.productNamePlaceholder} required />
            <Input label={t.productInfo.price} id="productPrice" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t.productInfo.pricePlaceholder} />
            <Input label={t.productInfo.targetLocation} id="targetLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.productInfo.targetLocationPlaceholder} />
            <Textarea label={t.productInfo.desiredOutcome} id="desiredOutcome" value={desiredOutcome} onChange={(e) => setDesiredOutcome(e.target.value)} placeholder={t.productInfo.desiredOutcomePlaceholder} />
            <Button onClick={handleSave} disabled={!name.trim()}>{t.productInfo.saveButton}</Button>
          </div>
        </Card>
        
        <div className="space-y-md">
          <h3 className="text-lg font-semibold">{t.productInfo.existingProducts}</h3>
          {products.length === 0 ? (
            <p className="text-muted">{t.productInfo.emptyState}</p>
          ) : (
            <div className="space-y-sm max-h-96 overflow-y-auto pr-sm">
              {products.map((p) => (
                <Card 
                    key={p.id} 
                    onClick={() => setActiveId('productId', p.id)}
                    className={`border-2 ${activeIds.productId === p.id ? 'border-primary' : 'border-transparent'}`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-sm mb-1">
                                <p className="font-semibold text-text">{p.name}</p>
                                {p.location && <span className="text-xs bg-border/50 text-muted font-mono px-2 py-0.5 rounded-full">{p.location}</span>}
                            </div>
                            <p className="text-sm text-muted">{p.desiredOutcome || t.productInfo.noOutcome}</p>
                        </div>
                        {activeIds.productId === p.id && <span className="text-xs bg-primary/20 text-primary font-bold py-1 px-2 rounded-full">{t.active}</span>}
                    </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};