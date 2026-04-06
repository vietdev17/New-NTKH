import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@furniturevn.com',
    );
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  // ============================================================
  // Generic send
  // ============================================================

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"FurnitureVN" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  // ============================================================
  // Email xac nhan don hang
  // ============================================================

  async sendOrderConfirmation(order: any): Promise<boolean> {
    const itemsHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${item.productName}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${item.unitPrice?.toLocaleString('vi-VN')}d
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${item.totalPrice?.toLocaleString('vi-VN')}d
          </td>
        </tr>`,
      )
      .join('');

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">FurnitureVN</h1>
        <p style="margin: 8px 0 0;">Xac nhan don hang</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="color: #333;">Cam on ban da dat hang!</h2>
        <p style="color: #666;">Ma don hang: <strong>${order.orderNumber}</strong></p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px; text-align: left;">San pham</th>
              <th style="padding: 12px; text-align: center;">SL</th>
              <th style="padding: 12px; text-align: right;">Don gia</th>
              <th style="padding: 12px; text-align: right;">Thanh tien</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px solid #2563eb; padding-top: 16px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 4px 0; color: #666;">Tam tinh:</td>
              <td style="text-align: right;">${(order.subtotal || 0).toLocaleString('vi-VN')}d</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666;">Phi van chuyen:</td>
              <td style="text-align: right;">${(order.shippingFee || 0).toLocaleString('vi-VN')}d</td>
            </tr>
            ${(order.discountAmount || 0) > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #22c55e;">Giam gia:</td>
              <td style="text-align: right; color: #22c55e;">-${order.discountAmount.toLocaleString('vi-VN')}d</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-size: 18px; font-weight: bold;">Tong cong:</td>
              <td style="text-align: right; font-size: 18px; font-weight: bold; color: #2563eb;">
                ${(order.total || 0).toLocaleString('vi-VN')}d
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 20px;">
          <h3 style="margin: 0 0 8px; color: #333;">Dia chi giao hang</h3>
          <p style="margin: 0; color: #666;">
            ${order.shippingStreet}, ${order.shippingWard},
            ${order.shippingDistrict}, ${order.shippingProvince}
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${this.frontendUrl}/orders/${order.orderNumber}"
             style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem don hang
          </a>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>FurnitureVN - Noi that chat luong cho moi nha</p>
      </div>
    </div>`;

    const email = order.customerEmail;
    if (!email) return false;

    return this.sendEmail(
      email,
      `Xac nhan don hang ${order.orderNumber} - FurnitureVN`,
      html,
    );
  }

  // ============================================================
  // Email reset mat khau
  // ============================================================

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">FurnitureVN</h1>
      </div>

      <div style="padding: 24px;">
        <h2 style="color: #333;">Dat lai mat khau</h2>
        <p style="color: #666;">
          Ban da yeu cau dat lai mat khau. Click vao nut ben duoi de tao mat khau moi.
          Link nay se het han sau 1 gio.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}"
             style="background: #2563eb; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">
            Dat lai mat khau
          </a>
        </div>

        <p style="color: #999; font-size: 13px;">
          Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.
        </p>
        <p style="color: #999; font-size: 13px;">
          Hoac copy link: <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
        </p>
      </div>

      <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>FurnitureVN - Noi that chat luong cho moi nha</p>
      </div>
    </div>`;

    return this.sendEmail(email, 'Dat lai mat khau - FurnitureVN', html);
  }

  // ============================================================
  // Email cap nhat trang thai don hang
  // ============================================================

  async sendOrderStatusUpdate(
    order: any,
    newStatus: string,
  ): Promise<boolean> {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: string }
    > = {
      confirmed: { label: 'Da xac nhan', color: '#3b82f6', icon: '&#9989;' },
      preparing: { label: 'Dang chuan bi', color: '#f59e0b', icon: '&#128230;' },
      in_transit: { label: 'Dang giao hang', color: '#f59e0b', icon: '&#128666;' },
      delivered: { label: 'Da giao thanh cong', color: '#22c55e', icon: '&#9989;' },
      cancelled: { label: 'Da huy', color: '#ef4444', icon: '&#10060;' },
    };

    const status = statusMap[newStatus] || {
      label: newStatus,
      color: '#666',
      icon: '',
    };

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">FurnitureVN</h1>
      </div>

      <div style="padding: 24px;">
        <h2 style="color: #333;">Cap nhat don hang ${order.orderNumber}</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="font-size: 40px; margin: 0;">${status.icon}</p>
          <p style="font-size: 20px; font-weight: bold; color: ${status.color}; margin: 8px 0;">
            ${status.label}
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${this.frontendUrl}/orders/${order.orderNumber}"
             style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem chi tiet don hang
          </a>
        </div>
      </div>

      <div style="background: #f8f9fa; padding: 16px; text-align: center; color: #999; font-size: 12px;">
        <p>FurnitureVN - Noi that chat luong cho moi nha</p>
      </div>
    </div>`;

    const email = order.customerEmail;
    if (!email) return false;

    return this.sendEmail(
      email,
      `Don hang ${order.orderNumber} - ${status.label}`,
      html,
    );
  }
}
