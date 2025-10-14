import { useState } from 'react';
import { Check, X, AlertCircle, Loader, CheckCircle, Info } from 'lucide-react';
import {
  validateGroupId,
  validateBotInGroup,
  sendWelcomeMessageToRegistry,
  generateVipLink,
  GroupValidationResult
} from '../lib/telegram-group-validator';

interface GroupConfigurationGuideProps {
  botToken: string;
  botName: string;
  vipGroupId: string;
  registryGroupId: string;
  vipGroupLink: string | null;
  onUpdate: (data: {
    vipGroupId: string;
    registryGroupId: string;
    vipGroupLink: string | null;
  }) => void;
}

export default function GroupConfigurationGuide({
  botToken,
  botName,
  vipGroupId,
  registryGroupId,
  vipGroupLink,
  onUpdate
}: GroupConfigurationGuideProps) {
  const [localVipId, setLocalVipId] = useState(vipGroupId);
  const [localRegistryId, setLocalRegistryId] = useState(registryGroupId);

  const [vipValidating, setVipValidating] = useState(false);
  const [registryValidating, setRegistryValidating] = useState(false);

  const [vipValidation, setVipValidation] = useState<GroupValidationResult | null>(null);
  const [registryValidation, setRegistryValidation] = useState<GroupValidationResult | null>(null);

  const [vipIdError, setVipIdError] = useState<string | null>(null);
  const [registryIdError, setRegistryIdError] = useState<string | null>(null);

  const [generatingLink, setGeneratingLink] = useState(false);
  const [localVipLink, setLocalVipLink] = useState(vipGroupLink);

  const handleValidateVip = async () => {
    setVipValidating(true);
    setVipValidation(null);
    setVipIdError(null);

    const idValidation = await validateGroupId(localVipId);
    if (!idValidation.isValid) {
      setVipIdError(idValidation.error || 'ID inválido');
      setVipValidating(false);
      return;
    }

    if (localVipId === localRegistryId) {
      setVipIdError('❌ Os IDs do Grupo VIP e Grupo de Notificação não podem ser iguais');
      setVipValidating(false);
      return;
    }

    const validation = await validateBotInGroup(botToken, localVipId);
    setVipValidation(validation);
    setVipValidating(false);

    if (validation.isValid) {
      setGeneratingLink(true);
      const linkResult = await generateVipLink(botToken, localVipId);
      setGeneratingLink(false);

      if (linkResult.link) {
        setLocalVipLink(linkResult.link);
        onUpdate({
          vipGroupId: localVipId,
          registryGroupId: localRegistryId,
          vipGroupLink: linkResult.link
        });
      }
    }
  };

  const handleValidateRegistry = async () => {
    setRegistryValidating(true);
    setRegistryValidation(null);
    setRegistryIdError(null);

    const idValidation = await validateGroupId(localRegistryId);
    if (!idValidation.isValid) {
      setRegistryIdError(idValidation.error || 'ID inválido');
      setRegistryValidating(false);
      return;
    }

    if (localVipId === localRegistryId) {
      setRegistryIdError('❌ Os IDs do Grupo VIP e Grupo de Notificação não podem ser iguais');
      setRegistryValidating(false);
      return;
    }

    const validation = await validateBotInGroup(botToken, localRegistryId);
    setRegistryValidation(validation);
    setRegistryValidating(false);

    if (validation.isValid) {
      await sendWelcomeMessageToRegistry(botToken, localRegistryId, botName);
      onUpdate({
        vipGroupId: localVipId,
        registryGroupId: localRegistryId,
        vipGroupLink: localVipLink
      });
    }
  };

  const ValidationStatus = ({ validation, isValidating }: { validation: GroupValidationResult | null; isValidating: boolean }) => {
    if (isValidating) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Validando...</span>
        </div>
      );
    }

    if (!validation) return null;

    if (validation.isValid) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">✅ Grupo configurado com sucesso!</span>
          </div>
          {validation.groupTitle && (
            <p className="text-sm text-green-600 mt-1">Grupo: {validation.groupTitle}</p>
          )}
        </div>
      );
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{validation.error}</p>
            <ul className="text-sm mt-2 space-y-1">
              <li className="flex items-center gap-2">
                {validation.botPresent ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                Bot presente no grupo
              </li>
              <li className="flex items-center gap-2">
                {validation.isAdmin ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                Bot é administrador
              </li>
              <li className="flex items-center gap-2">
                {validation.hasAllPermissions ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-600" />}
                Todas as permissões liberadas
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Como obter os IDs dos grupos:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Abra o @ScanIDBot no Telegram</li>
              <li>Para grupos: adicione o @ScanIDBot como admin temporário</li>
              <li>Para canais: encaminhe uma mensagem do canal para @ScanIDBot</li>
              <li>Copie o ID que começar com -100</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Grupo VIP</h3>
        <p className="text-sm text-gray-600 mb-4">
          Grupo onde os usuários serão adicionados automaticamente após adquirirem planos/assinaturas
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID VIP
            </label>
            <input
              type="text"
              value={localVipId}
              onChange={(e) => {
                setLocalVipId(e.target.value);
                setVipValidation(null);
                setVipIdError(null);
              }}
              placeholder="-1001234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={vipValidating}
            />
            {vipIdError && (
              <p className="text-red-600 text-sm mt-1">{vipIdError}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium mb-1">⚠️ Antes de validar:</p>
            <p>Certifique-se de que o bot já foi adicionado como administrador no VIP com TODAS as permissões!</p>
          </div>

          <button
            onClick={handleValidateVip}
            disabled={vipValidating || !localVipId || vipValidation?.isValid}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {vipValidating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Validando Grupo VIP...
              </>
            ) : vipValidation?.isValid ? (
              <>
                <Check className="w-5 h-5" />
                Grupo VIP Configurado
              </>
            ) : (
              'Validar Grupo VIP'
            )}
          </button>

          <ValidationStatus validation={vipValidation} isValidating={vipValidating} />

          {generatingLink && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Gerando link do grupo VIP...</span>
            </div>
          )}

          {localVipLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900 mb-1">Link VIP gerado:</p>
              <code className="text-xs text-green-700 break-all">{localVipLink}</code>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Grupo de Notificação (ID REGISTRO)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Grupo onde todas as vendas serão registradas e mídias armazenadas
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID REGISTRO
            </label>
            <input
              type="text"
              value={localRegistryId}
              onChange={(e) => {
                setLocalRegistryId(e.target.value);
                setRegistryValidation(null);
                setRegistryIdError(null);
              }}
              placeholder="-1001234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={registryValidating}
            />
            {registryIdError && (
              <p className="text-red-600 text-sm mt-1">{registryIdError}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium mb-1">⚠️ Antes de validar:</p>
            <p>Certifique-se de que o bot já foi adicionado como administrador no grupo de notificação com TODAS as permissões!</p>
          </div>

          <button
            onClick={handleValidateRegistry}
            disabled={registryValidating || !localRegistryId || registryValidation?.isValid}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {registryValidating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Validando Grupo de Notificação...
              </>
            ) : registryValidation?.isValid ? (
              <>
                <Check className="w-5 h-5" />
                Grupo de Notificação Configurado
              </>
            ) : (
              'Validar Grupo de Notificação'
            )}
          </button>

          <ValidationStatus validation={registryValidation} isValidating={registryValidating} />
        </div>
      </div>

      {vipValidation?.isValid && registryValidation?.isValid && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h4 className="text-xl font-bold text-green-900 mb-2">✅ Configuração Concluída!</h4>
          <p className="text-green-700">
            Ambos os grupos foram configurados corretamente. Seu bot está pronto para funcionar!
          </p>
        </div>
      )}
    </div>
  );
}
