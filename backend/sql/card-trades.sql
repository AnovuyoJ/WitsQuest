CREATE TABLE IF NOT EXISTS public.card_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offered_card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    requested_card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_trades_recipient ON public.card_trades(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_card_trades_sender    ON public.card_trades(sender_id, status);