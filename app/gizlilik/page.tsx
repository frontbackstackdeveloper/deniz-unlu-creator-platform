import type { Metadata } from "next";
import {
  BotanicalBackground,
  PageHero,
  SiteFooter,
  SiteHeader,
} from "../components/SiteChrome";
import { getPublicManagedContent } from "../../db/content-store";
import { managedLinksToMap } from "../managed-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK",
  description:
    "Deniz Ünlü internet sitesi gizlilik bilgileri ve çekiliş aydınlatma metni.",
};

export default async function PrivacyPage() {
  const links = managedLinksToMap((await getPublicManagedContent()).links);
  const privacyEmail =
    process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim().toLocaleLowerCase("tr-TR") ??
    "";

  return (
    <main>
      <BotanicalBackground />
      <SiteHeader />
      <PageHero
        kicker="GİZLİLİK VE KVKK"
        title="Verilerinize saygı duyuyoruz."
        description="Bu sayfa, site kullanımı ve çekiliş katılımı sırasında hangi bilgilerin neden işlendiğini açıklar."
      />

      <section className="page-content shell privacy-layout">
        <nav className="privacy-nav" aria-label="Gizlilik başlıkları">
          <a href="#genel">Genel gizlilik</a>
          <a href="#cekilis-aydinlatma">Çekiliş aydınlatma metni</a>
          <a href="#haklar">Haklarınız ve iletişim</a>
        </nav>

        <div className="privacy-document">
          <section id="genel">
            <p className="section-kicker">GENEL GİZLİLİK</p>
            <h2>Site kullanımı</h2>
            <p>
              Siteyi yalnızca görüntülediğinizde ad, e-posta veya telefon
              numarası talep edilmez. YouTube ve Dailymotion oynatıcıları ile
              YouTube, WhatsApp, Discord ve Kick bağlantıları üçüncü taraf
              hizmetlere aittir; bu hizmetlerin kendi gizlilik koşulları
              geçerlidir.
            </p>
            <p>
              Güvenlik ve kötüye kullanımın önlenmesi amacıyla barındırma
              sağlayıcısı tarafından IP adresi, istek zamanı ve teknik hata
              kayıtları kısa süreli olarak işlenebilir.
            </p>
          </section>

          <section id="cekilis-aydinlatma">
            <p className="section-kicker">ÇEKİLİŞ AYDINLATMA METNİ</p>
            <h2>Çekiliş katılımcıları için bilgilendirme</h2>
            <dl className="privacy-facts">
              <div>
                <dt>Veri sorumlusu</dt>
                <dd>Deniz Ünlü</dd>
              </div>
              <div>
                <dt>Toplanan veriler</dt>
                <dd>
                  Ad-soyad, e-posta adresi, katılım zamanı ve koşul onayları.
                </dd>
              </div>
              <div>
                <dt>İşleme amacı</dt>
                <dd>
                  Tekil katılımı sağlamak, çekilişi yürütmek, kazananı seçmek,
                  üyelik koşullarını doğrulamak ve sonucu duyurmak.
                </dd>
              </div>
              <div>
                <dt>Toplama yöntemi ve hukuki sebep</dt>
                <dd>
                  Bilgiler elektronik katılım formundan, çekilişe katılmak
                  isteyen kişinin ayrı açık rızasına dayanılarak alınır.
                </dd>
              </div>
              <div>
                <dt>Teknik hizmet sağlayıcılar</dt>
                <dd>
                  Veriler sitenin çalışması ve güvenliği için Cloudflare
                  barındırma, veritabanı ve Turnstile hizmetlerinde işlenebilir.
                  Turnstile doğrulama anahtarı yalnızca güvenlik kontrolü için
                  kullanılır ve çekiliş kaydında saklanmaz.
                </dd>
              </div>
              <div>
                <dt>Saklama süresi</dt>
                <dd>
                  Katılımcı bilgileri kazanan doğrulaması ve sonuç itirazları
                  tamamlandıktan sonra en geç 30 gün içinde yönetim panelinden
                  silinir. Kazanan adı sitede yalnızca kısaltılmış biçimde
                  gösterilir.
                </dd>
              </div>
            </dl>
            <p>
              Katılım bilgileri reklam veya pazarlama amacıyla kullanılmaz ve
              bu amaçlarla üçüncü kişilere satılmaz.
            </p>
          </section>

          <section id="haklar">
            <p className="section-kicker">HAKLARINIZ</p>
            <h2>Başvuru ve iletişim</h2>
            <p>
              KVKK kapsamındaki haklarınız çerçevesinde verilerinizin işlenip
              işlenmediğini öğrenme, bilgi talep etme, düzeltme veya silme
              isteme ve işleme faaliyetine itiraz etme hakkınız bulunmaktadır.
            </p>
            {privacyEmail ? (
              <a className="privacy-contact" href={`mailto:${privacyEmail}`}>
                {privacyEmail}
              </a>
            ) : links.discord ? (
              <a
                className="privacy-contact"
                href={links.discord}
                target="_blank"
                rel="noreferrer"
              >
                Resmî Discord topluluğu üzerinden site yönetimine ulaşın
              </a>
            ) : (
              <p className="privacy-contact privacy-contact--pending">
                Doğrudan iletişim adresi yayın öncesinde eklenecektir.
              </p>
            )}
            <small>
              Bu metin son güncelleme tarihi: 26 Temmuz 2026.
            </small>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
