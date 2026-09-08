namespace backend.Modules.Orders.Contracts;

/// <summary>
/// Números do evento para o painel da equipe. "Vendido" = pedido pago
/// (<c>Paid</c> ou <c>Redeemed</c>); pedidos <c>AwaitingPayment</c>/<c>Cancelled</c>
/// não entram. Um "ticket" passa a existir quando o pedido é pago.
/// </summary>
public record OrderStatsResponse
{
    /// <summary>Salchipões vendidos (soma das quantidades dos itens de pedidos pagos).</summary>
    public int SalchiposSold { get; init; }

    /// <summary>Total em reais dos pedidos pagos.</summary>
    public decimal Revenue { get; init; }

    /// <summary>Tickets pagos que ainda não foram resgatados (<c>Status == Paid</c>).</summary>
    public int TicketsToRedeem { get; init; }

    /// <summary>Tickets já resgatados no balcão (<c>Status == Redeemed</c>).</summary>
    public int TicketsRedeemed { get; init; }

    /// <summary>Tickets gerados ao todo (pagos + resgatados).</summary>
    public int TicketsGenerated { get; init; }

    /// <summary>Vendas por dia (horário de Brasília), em ordem crescente de data.</summary>
    public IReadOnlyList<DailySales> ByDay { get; init; } = [];
}

/// <summary>Uma barra do gráfico "salchipões por dia".</summary>
/// <param name="Day">Dia da venda no fuso America/Sao_Paulo (ex.: <c>2026-09-08</c>).</param>
/// <param name="Salchipos">Salchipões vendidos nesse dia.</param>
/// <param name="Revenue">Total em reais nesse dia.</param>
public record DailySales(DateOnly Day, int Salchipos, decimal Revenue);
