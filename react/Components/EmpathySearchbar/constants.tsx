export const ACTIONS = {
    newProduct: "newProduct",
    updateQuantity: "updateQuantity",
    removeProduct: "removeProduct",
}

// Jerarquía de negocio para asignar seller en el checkout (acordada con Gandhi):
// 1) gandhiaitijpv > 2) gandhicedispv > 3) cualquier marketplace != DEFAULT > 4) DEFAULT (fallback)
export const SELLER_PRIORITY = {
    THREE_PL: 'gandhiaitijpv',
    CEDIS: 'gandhicedispv',
    DEFAULT: '1',
}
