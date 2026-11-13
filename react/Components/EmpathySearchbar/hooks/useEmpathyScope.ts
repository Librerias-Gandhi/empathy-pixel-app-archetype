import { useEffect } from 'react';
import { useDevice } from 'vtex.device-detector';

export type EmpathyScope = 'desktop' | 'mobile';

export const DEFAULT_SCOPE: EmpathyScope = 'desktop';

/**
 * Resuelve el `scope` de Empathy ('desktop' | 'mobile') a partir del dispositivo
 * detectado por VTEX y lo mantiene sincronizado con el widget.
 *
 * Usa el mismo `useDevice` que `header-layout`, así el scope coincide con el header
 * (desktop/mobile) que se está renderizando. En SSR / primera carga se basa en los
 * hints del runtime y en el cliente reacciona a los cambios de breakpoint (resize).
 *
 * - Primer montaje: solo actualiza `window.initX.scope`; el `init()` lo toma de ahí.
 * - Cambios posteriores: llama a `InterfaceX.setSnippetConfig({ scope })`.
 *
 * El último scope se guarda en `window` porque el componente se desmonta/remonta al
 * cambiar entre `header-layout.desktop` y `header-layout.mobile`.
 */
export const useEmpathyScope = (): EmpathyScope => {
    const { isMobile } = useDevice();
    const scope: EmpathyScope = isMobile ? 'mobile' : DEFAULT_SCOPE;

    useEffect(() => {
        const w = window as any;
        const previousScope: EmpathyScope | undefined = w.__empathyScope;

        if (previousScope === scope) return;

        w.__empathyScope = scope;
        if (w.initX) w.initX.scope = scope;

        if (!previousScope) {
            console.log(`[Empathy] scope inicial: ${scope}`);
            return;
        }

        w.InterfaceX?.setSnippetConfig({ scope });
        console.log(`[Empathy] scope cambió: ${previousScope} -> ${scope}`);
    }, [scope]);

    return scope;
};
