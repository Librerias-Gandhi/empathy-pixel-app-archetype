import { DEFAULT_SELLER } from '../constants';

const NAME_COOKIE = 'ZipCode';

// Debe reflejar la lógica de gandhi-components (CustomAddToCart/EmpatyAddToCart).
export const fetchBestStockSellerBySku = async (skuId: any): Promise<any> => {
    try {
        const response = await fetch(`/v1/stock-balance/${skuId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Stock balance request failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching stock balance:', error);
        return null;
    }
}

// Prioridad: bestOption de stock-balance > marketplace de Empathy (!= DEFAULT) > DEFAULT.
export const resolvePrioritySeller = (stockBalanceResponse: any, sellerIds?: string[]): string => {
    const bestSellerId = stockBalanceResponse?.bestOption?.sellerId;
    if (bestSellerId) return bestSellerId;

    const marketplaceSeller = sellerIds?.find((id) => id !== DEFAULT_SELLER);
    return marketplaceSeller || DEFAULT_SELLER;
}

export const mapSkuItemForPixelEvent = (productItem: any) => {
    const category = productItem?.categories ? productItem.categories.map((category: any) => category.replace('/', ' ')).join(',') : ''
    const itemSku = productItem.items?.[0] ?? {}
    return {
        skuId: itemSku?.itemId,
        ean: itemSku?.ean,
        price: itemSku?.sellers?.[0]?.commertialOffer.Price,
        name: itemSku?.name,
        quantity: 1,
        productId: productItem.productId,
        productRefId: productItem.productReference,
        category,
        detailUrl: '/' + productItem.linkText + '/p',
        brand: productItem.brand,
        imageUrl: itemSku?.images?.[0]?.imageUrl,
        referenceId: itemSku?.referenceId?.[0]?.Value,
        seller: itemSku?.sellers?.[0]?.sellerId,
        sellerName: itemSku?.sellers?.[0]?.sellerName
    }
}

export const getZipCode = () => {
    return window.localStorage.getItem(NAME_COOKIE) || ""
}

export const findProductBySkuId = async (sku: any) => {
    const rawSku = String(sku);
    const cleanSku = rawSku.includes('-') ? rawSku.split('-')[0] : rawSku;

    try {
        const res = await fetch(`/api/catalog_system/pub/products/search?fq=skuId:${cleanSku}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const json = await res.json();
        const item = json[0];
        if (item && item.productId) {
            return await findProductByProductId(item.productId);
        } else {
            console.error("No se encontró el producto para el sku:", cleanSku);
            return null;
        }
    } catch (err) {
        console.error("Error en la petición:", err);
        return null;
    }
}

const findProductByProductId = async (productId: any) => {
    return new Promise(function (resolve, reject) {
        fetch(`/api/catalog_system/pub/products/search?fq=productId:${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }).then(res => res.json())
            .then((_json) => {
                resolve(_json);
            })
            .catch(err => {
                console.error("Error en la petición:", err);
                reject(err.status);
            });
    });
}

export const mapProductForGA4 = (product: any, skuId: string) => {
    const itemSku = product.items?.find((i: any) => i.itemId === skuId) || product.items?.[0] || {};
    const categories = product.categories?.[0]?.split('/').filter(Boolean) || [];

    return {
        item_id: itemSku?.itemId || product.productId,
        item_name: product.productName,
        item_brand: product.brand,
        item_category: categories[0] || '',
        item_category2: categories[1] || '',
        item_category3: categories[2] || '',
        item_category4: categories[3] || '',
        item_category5: categories[4] || '',
        item_variant: itemSku?.name,
        price: itemSku?.sellers?.[0]?.commertialOffer?.Price || 0,
        quantity: 1
    };
}
