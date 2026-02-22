import { hasSupabaseAdmin, supabaseAdmin } from './supabase-admin'

export type DonationMethod = string

export type DonationVirtualAccount = {
  bankName: string
  accountNumber: string
  accountHolder: string
  provider: string
  paymentMethod: string
}

export type DonationIncome = {
  id: string
  date: string
  donor: string
  amount: number
  method: DonationMethod
  message?: string
  providerTxId?: string | null
}

export type DonationExpense = {
  id: string
  date: string
  title: string
  amount: number
  organization: string
  receiptUrl?: string
}

export type DonationIntent = {
  id: string
  donorName: string
  donorMasked: string
  amount: number
  message?: string
  status: 'pending' | 'paid' | 'cancelled'
  providerIntentId?: string
  depositorHint?: string
  createdAt: string
  paidAt?: string | null
}

export async function getActiveDonationVirtualAccount(): Promise<DonationVirtualAccount> {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('donation_virtual_accounts')
    .select('bank_name, account_number, account_holder, provider, payment_method')
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('활성화된 기부 계좌 설정이 없습니다.')

  return {
    bankName: String(data.bank_name),
    accountNumber: String(data.account_number),
    accountHolder: String(data.account_holder),
    provider: String(data.provider),
    paymentMethod: String(data.payment_method),
  }
}

function normalizeDate(input?: string) {
  const value = input ?? new Date().toISOString()
  return new Date(value).toISOString().slice(0, 10)
}

export function formatKrw(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function maskDonorName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return '익명'
  if (trimmed.length <= 1) return `${trimmed}*`
  return `${trimmed[0]}${'*'.repeat(trimmed.length - 1)}`
}

export async function getDonationIncomes(): Promise<DonationIncome[]> {
  if (!hasSupabaseAdmin || !supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('donation_incomes')
    .select('id, date, donor, amount, method, message, provider_tx_id')
    .order('date', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    id: String(row.id),
    date: String(row.date),
    donor: String(row.donor),
    amount: Number(row.amount),
    method: row.method as DonationMethod,
    message: row.message ? String(row.message) : undefined,
    providerTxId: row.provider_tx_id ? String(row.provider_tx_id) : null,
  }))
}

export async function getDonationExpenses(): Promise<DonationExpense[]> {
  if (!hasSupabaseAdmin || !supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('donation_expenses')
    .select('id, date, title, amount, organization, receipt_url')
    .order('date', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    id: String(row.id),
    date: String(row.date),
    title: String(row.title),
    amount: Number(row.amount),
    organization: String(row.organization),
    receiptUrl: row.receipt_url ? String(row.receipt_url) : undefined,
  }))
}

export async function getDonationSummary() {
  const [incomes, expenses] = await Promise.all([getDonationIncomes(), getDonationExpenses()])

  const incomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0)

  return { incomeTotal, expenseTotal, balance: incomeTotal - expenseTotal }
}

export async function createDonationIntent(input: {
  donorName: string
  amount: number
  message?: string
  providerIntentId?: string
  depositorHint?: string
}) {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다.')
  }

  const donorName = input.donorName.trim()
  const amount = Math.floor(input.amount)

  if (!donorName || amount <= 0) throw new Error('유효하지 않은 기부 요청입니다.')

  const row = {
    donor_name: donorName,
    donor_masked: maskDonorName(donorName),
    amount,
    message: input.message?.trim() || null,
    provider_intent_id: input.providerIntentId ?? null,
    depositor_hint: input.depositorHint ?? null,
    status: 'pending',
  }

  const { data, error } = await supabaseAdmin.from('donation_intents').insert(row).select('*').single()

  if (error || !data) throw new Error(error?.message ?? '기부 의도 생성에 실패했습니다.')

  return {
    id: String(data.id),
    donorName: String(data.donor_name),
    donorMasked: String(data.donor_masked),
    amount: Number(data.amount),
    message: data.message ? String(data.message) : undefined,
    status: data.status as DonationIntent['status'],
    providerIntentId: data.provider_intent_id ? String(data.provider_intent_id) : undefined,
    depositorHint: data.depositor_hint ? String(data.depositor_hint) : undefined,
    createdAt: String(data.created_at),
    paidAt: data.paid_at ? String(data.paid_at) : null,
  }
}

export async function getDonationIntentById(intentId: string): Promise<DonationIntent | null> {
  if (!hasSupabaseAdmin || !supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('donation_intents')
    .select('*')
    .eq('id', intentId)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: String(data.id),
    donorName: String(data.donor_name),
    donorMasked: String(data.donor_masked),
    amount: Number(data.amount),
    message: data.message ? String(data.message) : undefined,
    status: data.status as DonationIntent['status'],
    providerIntentId: data.provider_intent_id ? String(data.provider_intent_id) : undefined,
    depositorHint: data.depositor_hint ? String(data.depositor_hint) : undefined,
    createdAt: String(data.created_at),
    paidAt: data.paid_at ? String(data.paid_at) : null,
  }
}

export async function recordDepositedDonation(input: {
  intentId?: string
  providerTxId: string
  donorName?: string
  amount: number
  message?: string
  depositedAt?: string
}) {
  if (!hasSupabaseAdmin || !supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다.')
  }

  const providerTxId = input.providerTxId.trim()
  const amount = Math.floor(input.amount)

  if (!providerTxId || amount <= 0) throw new Error('유효하지 않은 입금 웹훅 데이터입니다.')

  const { data: existingIncome } = await supabaseAdmin
    .from('donation_incomes')
    .select('id')
    .eq('provider_tx_id', providerTxId)
    .maybeSingle()

  if (existingIncome) return { duplicated: true }

  let donor = '익명'

  if (input.intentId) {
    const { data: intentData } = await supabaseAdmin
      .from('donation_intents')
      .select('donor_masked')
      .eq('id', input.intentId)
      .maybeSingle()

    if (intentData?.donor_masked) donor = String(intentData.donor_masked)
  }

  if (input.donorName) donor = maskDonorName(input.donorName)
  const account = await getActiveDonationVirtualAccount()

  const { error: incomeError } = await supabaseAdmin.from('donation_incomes').insert({
    date: normalizeDate(input.depositedAt),
    donor,
    amount,
    method: account.paymentMethod,
    message: input.message?.trim() || null,
    provider: account.provider,
    provider_tx_id: providerTxId,
    intent_id: input.intentId ?? null,
  })

  if (incomeError) throw new Error(incomeError.message)

  if (input.intentId) {
    await supabaseAdmin
      .from('donation_intents')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', input.intentId)
  }

  return { duplicated: false }
}
