import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function matchMYOs() {
    console.log("Üniversite verileri çekiliyor...");
    const { data: unis, error } = await supabase.from('universities').select('id, name, parent_id');
    
    if (error) {
        console.error("Veritabanı Hatası:", error);
        return;
    }

    // Ana üniversiteler ve henüz eşleşmemiş MYO'ları ayır
    const mainUnis = unis.filter(u => !u.name.includes('MESLEK YÜKSEKOKULU'));
    const myos = unis.filter(u => u.name.includes('MESLEK YÜKSEKOKULU') && !u.parent_id);

    console.log(`Toplam ${mainUnis.length} Ana Üniversite, ${myos.length} Eşleşmeyi Bekleyen MYO bulundu.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const myo of myos) {
        let parent = null;
        const myoName = myo.name.trim();
        const words = myoName.split(' ');

        // STRATEJİ 1: MYO'nun adı, ana üniversitenin adını tamamen içeriyor mu?
        const exactMatches = mainUnis.filter(u => myoName.includes(u.name));
        
        if (exactMatches.length === 1) {
            parent = exactMatches[0];
        } 
        // STRATEJİ 2: İlk kelime eşleşmesi (Örn: "İSKENDERUN")
        else {
            const firstWord = words[0];
            const wordMatches = mainUnis.filter(u => u.name.startsWith(firstWord));
            
            if (wordMatches.length === 1) {
                parent = wordMatches[0];
            } else if (wordMatches.length > 1 && words.length > 1) {
                // İlk kelimede birden fazla sonuç çıkarsa (Örn: Ankara) ilk 2 kelimeye bak
                const twoWords = `${words[0]} ${words[1]}`;
                const twoWordMatches = mainUnis.filter(u => u.name.startsWith(twoWords));
                if (twoWordMatches.length === 1) parent = twoWordMatches[0];
            }
        }

        // EŞLEŞME BULUNDUYSA VERİTABANINA YAZ
        if (parent) {
            console.log(`[BAŞARILI] ${myoName} ---> ${parent.name}`);
            const { error: updateError } = await supabase
                .from('universities')
                .update({ parent_id: parent.id })
                .eq('id', myo.id);
                
            if (updateError) console.error("Kayıt hatası:", updateError);
            else successCount++;
        } else {
            console.log(`[BULUNAMADI] ${myoName} için ana üniversite tespit edilemedi.`);
            failCount++;
        }
    }

    console.log(`\nİşlem Tamamlandı! ${successCount} MYO bağlandı, ${failCount} MYO manuel kontrol bekliyor.`);
}

matchMYOs();