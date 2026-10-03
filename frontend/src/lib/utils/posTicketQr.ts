import QRCode from 'qrcode';
import { urlQrArca, type PosTicketDto } from './posTicketHtml';

function leerBlob(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

async function incrustarLogo(dto: PosTicketDto): Promise<PosTicketDto> {
	const logo = String(dto.empresa.logo || '').trim();
	if (!logo || logo.startsWith('data:')) return dto;
	try {
		const response = await fetch(logo);
		if (!response.ok) return dto;
		const dataUrl = await leerBlob(await response.blob());
		if (!dataUrl.startsWith('data:image/')) return dto;
		return { ...dto, empresa: { ...dto.empresa, logo: dataUrl } };
	} catch {
		return dto;
	}
}

export async function prepararTicketFiscal(dto: PosTicketDto): Promise<PosTicketDto> {
	return adjuntarQrArca(await incrustarLogo(dto));
}

export async function adjuntarQrArca(dto: PosTicketDto): Promise<PosTicketDto> {
	if ((dto.tipo !== 'FCA' && dto.tipo !== 'FCB') || !dto.cae || dto.qr) return dto;
	const url = urlQrArca(dto);
	if (!url) return dto;
	const qr = await QRCode.toDataURL(url, {
		errorCorrectionLevel: 'M',
		margin: 1,
		width: 220,
		color: { dark: '#000000', light: '#ffffff' }
	});
	return { ...dto, qr };
}
