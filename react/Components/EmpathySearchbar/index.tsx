import React, { useEffect, useRef, useContext } from "react";
import { useOrderItems } from 'vtex.order-items/OrderItems';
import { useOrderForm } from 'vtex.order-manager/OrderForm';
import { ToastContext } from 'vtex.styleguide';
import { handleCartOperation } from "./utils/handleCart";
import { useEmpathyWishlist } from './hooks/handleWishlist';
import { findProductBySkuId, fetchBestStockSellerBySku, resolvePrioritySeller } from './utils';
import { useGAAnalytics } from './hooks/useGAAnalytics';
import { useSessionListener } from './hooks/useSessionListener';
import { ACTIONS } from './constants';

const EmpathySearchbar = () => {
    useSessionListener();
    const { pushAddToCartEvent, pushRemoveFromCartEvent } = useGAAnalytics();
    const { addItems, updateQuantity, removeItem } = useOrderItems();
    const { orderForm, loading: orderFormLoading } = useOrderForm();
    const { items: cartItems } = orderForm;
    const { showToast } = useContext(ToastContext);

    const itemsRef = useRef(cartItems);
    const initialSyncDone = useRef(false);

    const { handleWishlistOperation } = useEmpathyWishlist();
    const wishlistActionRef = useRef(handleWishlistOperation);

    useEffect(() => {
        wishlistActionRef.current = handleWishlistOperation;
    }, [handleWishlistOperation]);

    useEffect(() => {
        itemsRef.current = cartItems;

        // After initial sync, keep Empathy's cart in sync with VTEX's confirmed state.
        // This corrects optimistic updates that VTEX rejected (e.g. out-of-stock limits).
        if (!initialSyncDone.current) return;

        const whitelabel = (window as any).initX?.whitelabel;
        const confirmedCart = (cartItems || []).reduce((acc: Record<string, number>, item: any) => {
            if (item.id) acc[whitelabel ? `${item.id}-${whitelabel}` : String(item.id)] = item.quantity;
            return acc;
        }, {});

        (window as any).InterfaceX?.setSnippetConfig({ cart: confirmedCart });
    }, [cartItems]);

    async function handleClickAction({
        sellerId, quantity, productSKU
    }: any) {
        if (!productSKU || !sellerId) {
            console.error("Error: productSKU or seller_id not defined", { productSKU, sellerId });
            return null;
        }

        if (quantity <= 0) {
            quantity = -1;
        }

        let item_object = {
            id: Number(productSKU),
            quantity,
            seller: sellerId
        };

        return item_object;
    }

    async function handleActionAddToCart({ action, skuId, quantity, sellerIds }: any) {
        const productData: any = await findProductBySkuId(skuId);
        const product = productData && productData.length > 0 ? productData[0] : null;

        const stockBalanceResponse = await fetchBestStockSellerBySku(skuId);

        const item_object = await handleClickAction({
            productSKU: skuId,
            sellerId: resolvePrioritySeller(stockBalanceResponse, sellerIds),
            quantity,
        });

        const foundItem = itemsRef.current?.find((item: any) => item.id === skuId);

        switch (action) {
            case ACTIONS.newProduct:
                if (product) pushAddToCartEvent(product, skuId);
                if (item_object) addItems([item_object]);
                break;
            case ACTIONS.updateQuantity:
                if (product) pushAddToCartEvent(product, skuId);
                if (foundItem) updateQuantity({ uniqueId: foundItem.uniqueId, quantity });
                break;
            case ACTIONS.removeProduct:
                if (product) pushRemoveFromCartEvent(product, skuId);
                if (foundItem) removeItem({ uniqueId: foundItem.uniqueId });
                break;
            default:
                console.error("Unknown action:", action);
                return;
        }
    }

    // Declared before the sync useEffect so window.initX is set when the sync reads window.initX.whitelabel
    useEffect(() => {
        /**
         * Asegurate de ajustar la configuración de `initX` según las necesidades de tu tienda.
         *
         * Más información en https://github.com/empathyco/empathy-pixel-app-archetype?#3-configuraci%C3%B3n-initx
         */
        (window as any).initX = {
            instance: "gandhinew",
            lang: "es",
            scope: "desktop",
            currency: "MXN",
            whitelabel: "empathymxwl1",
            consent: true,
            viewMode: 'embedded',
            resultsSelector: '.flex.flex-grow-1.w-100.flex-column',
            callbacks: {
                UserClickedResultAddToCart: function (result: any, metadata: any) {
                    const cart = (window as any).InterfaceX?.getSnippetConfig()?.cart || {};
                    handleCartOperation({
                        result,
                        metadata: metadata || {},
                        cart,
                        actionType: 'add',
                        handleActionAddToCart,
                        showToast,
                    });
                },
                UserClickedResultVariantAddToCart: function (result: any, metadata: any) {
                    const cart = (window as any).InterfaceX?.getSnippetConfig()?.cart || {};
                    handleCartOperation({
                        result,
                        metadata: metadata || {},
                        cart,
                        actionType: 'add',
                        handleActionAddToCart,
                        showToast,
                    });
                },
                UserClickedResultRemoveFromCart: function (result: any, metadata: any) {
                    const cart = (window as any).InterfaceX?.getSnippetConfig()?.cart || {};
                    handleCartOperation({
                        result,
                        metadata: metadata || {},
                        cart,
                        actionType: 'remove',
                        handleActionAddToCart,
                        showToast,
                    });
                },
                UserClickedResultVariantRemoveFromCart: function (result: any, metadata: any) {
                    const cart = (window as any).InterfaceX?.getSnippetConfig()?.cart || {};
                    handleCartOperation({
                        result,
                        metadata: metadata || {},
                        cart,
                        actionType: 'remove',
                        handleActionAddToCart,
                        showToast,
                    });
                },
                UserClickedResultWishlist: function (result: any) {
                    if (wishlistActionRef.current) {
                        wishlistActionRef.current(result);
                    }
                }
            },
            uiLang: "es-MX"
        };

        // InterfaceX has no documented destroy/reset API, so re-mounting this component
        // (e.g. during a VTEX SPA navigation) would spawn a second, competing widget instance.
        if (!(window as any).__interfaceXInitialized) {
            (window as any).InterfaceX?.init();
            (window as any).__interfaceXInitialized = true;
        }

    }, []);

    // Sync pre-existing cart to Empathy once on mount, after orderForm is ready
    useEffect(() => {
        if (orderFormLoading || initialSyncDone.current) return;
        initialSyncDone.current = true;

        const items = orderForm.items || [];
        if (items.length === 0) return;

        const whitelabel = (window as any).initX?.whitelabel;
        const initialCart = items.reduce((acc: Record<string, number>, item: any) => {
            if (item.id) acc[whitelabel ? `${item.id}-${whitelabel}` : String(item.id)] = item.quantity;
            return acc;
        }, {});

        (window as any).InterfaceX?.setSnippetConfig({ cart: initialCart });
    }, [orderFormLoading]);

    return (
        <div id="empathy-searchbar">
            <div className="w-100" id="empathy-input" data-teleport="empathy-search-box-container"></div>
        </div>
    );
}

export default EmpathySearchbar
