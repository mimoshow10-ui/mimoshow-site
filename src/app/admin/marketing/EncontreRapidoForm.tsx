'use client';

import { useState } from 'react';
import Image from 'next/image';
import { salvarEncontreRapido } from './actions';
import {
  Compass,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export interface SegmentoData {
  id: string;
  nome: string;
  subtitulo?: string;
  link_url: string;
  imagem_url?: string;
  tag?: string;
  ativo: boolean;
}

interface Props {
  segmentosIniciais: SegmentoData[];
  categoriasDisponiveis?: Array<{ nome: string; slug: string }>;
}

const SEGMENTOS_DEFAULT: SegmentoData[] = [
  {
    id: 'adesivos',
    nome: 'Adesivos Pet',
    subtitulo: 'Piercings e EVA Glitter',
    link_url: '/categoria/adesivos',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/16597512806/produto_16597512806_10_1788997374469.jpg',
    tag: 'Top Vendas',
    ativo: true,
  },
  {
    id: 'gravatinhas',
    nome: 'Gravatinhas',
    subtitulo: 'P, M, G em Cetim',
    link_url: '/categoria/gravatinhas',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/15982227440/produto_15982227440_0_1789139376067.jpg',
    tag: '',
    ativo: true,
  },
  {
    id: 'lacinhos',
    nome: 'Lacinhos',
    subtitulo: 'Apliques e Borrachinhas',
    link_url: '/categoria/lacinhos',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/15951711280/produto_15951711280_0_1789157429390.jpg',
    tag: '',
    ativo: true,
  },
  {
    id: 'colarinhos',
    nome: 'Colarinhos',
    subtitulo: 'Elegância para Banho & Tosa',
    link_url: '/busca?q=colarinho',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/produtos/ms4065/ms4065_1788895887748_1.jpg',
    tag: '',
    ativo: true,
  },
  {
    id: 'bandanas',
    nome: 'Bandanas',
    subtitulo: 'Estampas e Acabamento',
    link_url: '/categoria/bandanas',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/produtos/MS3375BD-20P/MS3375BD-20P_1788896120253_1.jpg',
    tag: '',
    ativo: true,
  },
  {
    id: 'lancamentos',
    nome: 'Lançamentos',
    subtitulo: 'Novidades da Semana',
    link_url: '/busca?ordem=mais_recentes',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/produtos/ms4599/ms4599_1788902180741_11.jpg',
    tag: 'Novo',
    ativo: true,
  },
  {
    id: 'kits',
    nome: 'Kits Econômicos',
    subtitulo: 'Maior Lucro por Unidade',
    link_url: '/busca?q=kit',
    imagem_url: 'https://dehtqlcevoheqajejjcv.supabase.co/storage/v1/object/public/produtos-fotos/15310663798/produto_15310663798_0_1789148623091.jpg',
    tag: 'Econômico',
    ativo: true,
  },
];

export default function EncontreRapidoForm({
  segmentosIniciais,
  categoriasDisponiveis = [],
}: Props) {
  const [items, setItems] = useState<SegmentoData[]>(() => {
    if (segmentosIniciais && segmentosIniciais.length > 0) {
      return segmentosIniciais;
    }
    return SEGMENTOS_DEFAULT;
  });

  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [fileObjects, setFileObjects] = useState<Record<number, File>>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    tipo: 'sucesso' | 'erro';
    mensagem: string;
  } | null>(null);

  function adicionarSegmento() {
    const novo: SegmentoData = {
      id: `seg_${Date.now()}`,
      nome: 'Novo Segmento',
      subtitulo: 'Descrição curta',
      link_url: '/categoria/adesivos',
      imagem_url: '',
      tag: '',
      ativo: true,
    };
    setItems((prev) => [...prev, novo]);
  }

  function removerSegmento(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    // Limpar previews correspondentes
    const newPreviews = { ...previews };
    delete newPreviews[index];
    setPreviews(newPreviews);
    const newFiles = { ...fileObjects };
    delete newFiles[index];
    setFileObjects(newFiles);
  }

  function moverParaCima(index: number) {
    if (index === 0) return;
    const novos = [...items];
    const temp = novos[index - 1];
    novos[index - 1] = novos[index];
    novos[index] = temp;
    setItems(novos);
  }

  function moverParaBaixo(index: number) {
    if (index === items.length - 1) return;
    const novos = [...items];
    const temp = novos[index + 1];
    novos[index + 1] = novos[index];
    novos[index] = temp;
    setItems(novos);
  }

  function atualizarCampo<K extends keyof SegmentoData>(
    index: number,
    campo: K,
    valor: SegmentoData[K]
  ) {
    setItems((prev) => {
      const novos = [...prev];
      novos[index] = { ...novos[index], [campo]: valor };
      return novos;
    });
  }

  function handleFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileObjects((prev) => ({ ...prev, [index]: file }));
      const objectUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [index]: objectUrl }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('segmentos_json', JSON.stringify(items));

      // Anexar arquivos de upload
      Object.entries(fileObjects).forEach(([idxStr, file]) => {
        formData.append(`foto_file_${idxStr}`, file);
      });

      const res = await salvarEncontreRapido(formData);
      if (res.sucesso) {
        setFeedback({
          tipo: 'sucesso',
          mensagem: res.mensagem || 'Segmentos salvos com sucesso!',
        });
      } else {
        setFeedback({
          tipo: 'erro',
          mensagem: res.erro || 'Falha ao salvar segmentos.',
        });
      }
    } catch (err: any) {
      setFeedback({
        tipo: 'erro',
        mensagem: err.message || 'Erro inesperado ao salvar.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="encontre-rapido"
      className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-6 scroll-mt-6"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
        <div>
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <Compass size={22} className="text-primary" />
            Encontre Rápido (Atalhos de Segmentos da Home)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cadastre os segmentos comerciais exibidos no topo da página inicial. Adicione o título, a foto do produto/segmento e o link de destino.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-orange-100 text-primary border border-orange-200 text-xs font-black px-3 py-1 rounded-full w-fit">
            {items.filter((i) => i.ativo).length} Ativo(s)
          </span>
          <button
            type="button"
            onClick={adicionarSegmento}
            className="inline-flex items-center gap-1.5 bg-secondary hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Plus size={14} />
            Novo Segmento
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            feedback.tipo === 'sucesso'
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}
        >
          {feedback.tipo === 'sucesso' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {feedback.mensagem}
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {items.map((item, index) => {
            const previewUrl = previews[index] || item.imagem_url;

            return (
              <div
                key={item.id || index}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  item.ativo
                    ? 'bg-gray-50/70 border-gray-200/90 hover:border-primary/40'
                    : 'bg-gray-100/60 border-dashed border-gray-300 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
                  {/* Foto e Preview */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center shadow-2xs">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt={item.nome || 'Segmento'}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="text-gray-300 flex flex-col items-center justify-center text-[10px] font-bold">
                          <Upload size={18} />
                          <span>Sem foto</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-secondary text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition shadow-2xs">
                        <Upload size={12} className="text-primary" />
                        <span>Carregar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(index, e)}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Ou cole a URL da imagem"
                        value={item.imagem_url || ''}
                        onChange={(e) =>
                          atualizarCampo(index, 'imagem_url', e.target.value)
                        }
                        className="w-48 sm:w-56 text-[10px] bg-white border border-gray-200 rounded-md px-2 py-0.5 focus:border-primary focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Campos de Texto: Nome, Subtítulo, Link e Tag */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1 w-full">
                    {/* Nome do Segmento */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-0.5">
                        Nome do Segmento
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Adesivos Pet"
                        value={item.nome}
                        onChange={(e) =>
                          atualizarCampo(index, 'nome', e.target.value)
                        }
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 font-bold text-secondary focus:border-primary focus:outline-hidden"
                      />
                    </div>

                    {/* Subtítulo / Frase Curta */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-0.5">
                        Subtítulo / Destaque
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Piercings e EVA Glitter"
                        value={item.subtitulo || ''}
                        onChange={(e) =>
                          atualizarCampo(index, 'subtitulo', e.target.value)
                        }
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:border-primary focus:outline-hidden"
                      />
                    </div>

                    {/* Link de Destino */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-0.5 flex items-center justify-between">
                        <span>Link de Destino</span>
                        <LinkIcon size={10} className="text-primary" />
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: /categoria/adesivos"
                        value={item.link_url}
                        onChange={(e) =>
                          atualizarCampo(index, 'link_url', e.target.value)
                        }
                        list={`categorias-list-${index}`}
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 font-mono focus:border-primary focus:outline-hidden"
                      />
                      <datalist id={`categorias-list-${index}`}>
                        {categoriasDisponiveis.map((cat) => (
                          <option
                            key={cat.slug}
                            value={`/categoria/${cat.slug}`}
                          >
                            {cat.nome}
                          </option>
                        ))}
                        <option value="/busca?q=kit">Kits Econômicos</option>
                        <option value="/busca?ordem=mais_recentes">
                          Lançamentos Recentes
                        </option>
                      </datalist>
                    </div>

                    {/* Tag Opcional */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-0.5 flex items-center gap-1">
                        <Tag size={10} className="text-primary" />
                        <span>Tag Badge (Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Top Vendas, Novo"
                        value={item.tag || ''}
                        onChange={(e) =>
                          atualizarCampo(index, 'tag', e.target.value)
                        }
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:border-primary focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Ações: Reordenar, Ativar e Deletar */}
                  <div className="flex items-center gap-1 self-end lg:self-center flex-shrink-0 pt-2 lg:pt-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moverParaCima(index)}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      title="Mover para cima"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => moverParaBaixo(index)}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        atualizarCampo(index, 'ativo', !item.ativo)
                      }
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        item.ativo
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                      title={item.ativo ? 'Desativar segmento' : 'Ativar segmento'}
                    >
                      {item.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => removerSegmento(index)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer ml-1"
                      title="Remover segmento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com Botão Salvar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={adicionarSegmento}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-secondary text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Adicionar Outro Segmento</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:brightness-105 text-white text-xs font-black px-6 py-2.5 rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? (
              <span>Salvando Segmentos...</span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Salvar Segmentos do Encontre Rápido</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
