import { ACTIONS } from '../constants';
import { getCartToastMessage } from './cartToastMessages';

export async function handleCartOperation({
    result,
    metadata,
    cart,
    actionType,
    handleActionAddToCart,
    showToast,
}: {
    result: any;
    metadata: any;
    cart: any;
    actionType: 'add' | 'remove';
    handleActionAddToCart: (params: any) => Promise<void> | void;
    showToast?: (params: { message: string; duration?: number }) => void;
}) {
    if (!result || !result.id) return;

    const rawId = String(result.id);
    const cleanId = rawId.includes('-') ? rawId.split('-')[0] : rawId;
    let quantity: number;
    let action: string;

    if (actionType === 'add') {
        quantity = metadata.inputValue || (cart[rawId] ? cart[rawId] + 1 : 1);
        action = cart[rawId] ? ACTIONS.updateQuantity : ACTIONS.newProduct;

        if (typeof cart === 'object' && cart !== null) {
            cart[rawId] = quantity;
        }
    } else {
        quantity = metadata.inputValue || (cart[rawId] ? cart[rawId] - 1 : 0);
        action = ACTIONS.updateQuantity;

        if (typeof cart === 'object' && cart !== null) {
            if (quantity <= 0) {
                action = ACTIONS.removeProduct;
                delete cart[rawId];
            } else {
                cart[rawId] = quantity;
            }
        }
    }

    (window as any).InterfaceX.setSnippetConfig({
        cart: { ...cart },
    });

    try {
        await handleActionAddToCart({ skuId: cleanId, quantity, action, sellerIds: result.sellerIds });
        if (showToast) {
            showToast(getCartToastMessage(actionType === 'add' ? 'addSuccess' : 'removeSuccess'));
        }
    } catch (error) {
        console.error('Cart operation error:', error);
        if (showToast) {
            showToast(getCartToastMessage(actionType === 'add' ? 'addError' : 'removeError'));
        }
    }
}
