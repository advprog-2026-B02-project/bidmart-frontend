import OrderListPage from "@/components/order/OrderListPage";

export default function BuyerOrdersPage() {
  return (
    <OrderListPage
      role="BUYER"
      pageTitle="Pesanan Saya"
      pageSubtitle="Pantau semua barang lelang yang berhasil kamu menangkan"
    />
  );
}