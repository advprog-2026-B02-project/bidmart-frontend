import OrderListPage from "@/components/order/OrderListPage";

export default function SellerOrdersPage() {
  return (
    <OrderListPage
      role="SELLER"
      pageTitle="Pesanan Toko"
      pageSubtitle="Kelola pesanan masuk dan update status pengiriman barang dari tokomu"
    />
  );
}