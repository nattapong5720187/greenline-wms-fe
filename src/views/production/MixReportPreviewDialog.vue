<template>
  <Dialog
    :visible="visible"
    modal
    :header="header"
    :style="{ width: '900px', maxWidth: '96vw' }"
    :contentStyle="{ padding: '0', background: '#f1f5f9' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="preview-wrap">
      <iframe
        v-if="html"
        ref="frame"
        class="preview-frame"
        :srcdoc="html"
        title="preview"
      />
    </div>

    <template #footer>
      <div class="footer-bar">
        <span class="hint"><i class="pi pi-info-circle" /> เลือก “บันทึกเป็น PDF (Save as PDF)” ในหน้าต่างพิมพ์</span>
        <div class="footer-btns">
          <Button label="ปิด" text @click="$emit('update:visible', false)" />
          <Button label="ดาวน์โหลด PDF" icon="pi pi-download" class="btn-primary" @click="download" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { ref } from "vue";

defineProps({
  visible: { type: Boolean, default: false },
  header: { type: String, default: "ตัวอย่างเอกสาร" },
  html: { type: String, default: "" },
});
defineEmits(["update:visible"]);

const frame = ref(null);

function download() {
  const win = frame.value?.contentWindow;
  if (!win) return;
  win.focus();
  win.print();
}
</script>

<style scoped>
.preview-wrap {
  height: 68vh;
  overflow: auto;
  padding: 18px;
}
.preview-frame {
  width: 100%;
  height: 1180px;
  border: none;
  background: transparent;
  display: block;
}
.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}
.hint {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-btns {
  display: flex;
  gap: 8px;
}
</style>
