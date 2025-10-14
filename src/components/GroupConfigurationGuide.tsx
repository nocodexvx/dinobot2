import { Info } from 'lucide-react';

interface GroupConfigurationGuideProps {
  vipGroupId: string;
  registryGroupId: string;
  onVipChange: (value: string) => void;
  onRegistryChange: (value: string) => void;
}

export default function GroupConfigurationGuide({
  vipGroupId,
  registryGroupId,
  onVipChange,
  onRegistryChange
}: GroupConfigurationGuideProps) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Grupo VIP</h3>
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
              value={vipGroupId}
              onChange={(e) => onVipChange(e.target.value)}
              placeholder="-1001234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium mb-2">⚠️ Permissões Necessárias:</p>
            <ul className="space-y-1 ml-4 list-none">
              <li>✅ Adicionar membros</li>
              <li>✅ Banir/restringir membros</li>
              <li>✅ Deletar mensagens</li>
            </ul>
            <p className="mt-2 text-xs font-medium">Adicione o bot como admin e ative essas 3 permissões no grupo VIP</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Grupo de Notificação (ID REGISTRO)</h3>
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
              value={registryGroupId}
              onChange={(e) => onRegistryChange(e.target.value)}
              placeholder="-1001234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-medium mb-2">⚠️ Permissões Necessárias:</p>
            <ul className="space-y-1 ml-4 list-none">
              <li>✅ Adicionar membros</li>
              <li>✅ Banir/restringir membros</li>
              <li>✅ Deletar mensagens</li>
            </ul>
            <p className="mt-2 text-xs font-medium">Adicione o bot como admin e ative essas 3 permissões no grupo de notificação</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          💡 <strong>Dica:</strong> Clique em "Salvar Alterações" e o sistema irá validar automaticamente os grupos e configurar tudo para você!
        </p>
      </div>
    </div>
  );
}
