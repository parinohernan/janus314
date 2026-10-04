import QRCode from 'qrcode';
import { obtenerLogoTicket } from '$lib/services/LogoTicketService';
import { urlQrArca, type PosTicketDto } from './posTicketHtml';

export async function adjuntarLogoTicket(dto: PosTicketDto): Promise<PosTicketDto> {
	const logo = await obtenerLogoTicket();
	return { ...dto, empresa: { ...dto.empresa, logo: logo ?? undefined } };
}

export async function prepararTicketFiscal(dto: PosTicketDto): Promise<PosTicketDto> {
	return adjuntarQrArca(await adjuntarLogoTicket(dto));
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
